(() => {
  const defaultData = {
    recipientName: "Emily",
    message: "Wishing you a wonderful birthday filled with happiness and love.",
    senderName: "John"
  };
  const dataKey = "birthday-glass-cake-data";
  const screens = [...document.querySelectorAll(".screen")];
  const video1 = document.querySelector("#video1");
  const video2 = document.querySelector("#video2");
  const soundToggle = document.querySelector("#soundToggle");
  const candlesButton = document.querySelector("#candlesButton");
  const letterPrompt = document.querySelector("#letterPrompt");
  const letterCopy = document.querySelector("#letterCopy");
  let started = false;
  // A new visit always starts Sound ON. The in-memory value persists through every card screen and Replay.
  let muted = false;
  const bgmUrl = "assets/birthday-magical.mp3";
  const bgmVolume = 0.42;
  let audioContext = null;
  let bgmBuffer = null;
  let bgmSource = null;
  let bgmGain = null;
  let bgmStartedAt = 0;
  let bgmOffset = 0;
  let bgmFetchPromise = null;
  let bgmDecodePromise = null;
  let audioUnlocked = false;
  let bgmShouldPlay = false;

  const media = window.BirthdayGlassCakeMedia;
  video1.src = media.VIDEO_1_URL;
  video2.src = media.VIDEO_2_URL;

  function decodeHashData() {
    const match = location.hash.match(/(?:^#|[&])d=([^&]+)/);
    if (!match) return null;
    try {
      const base64 = decodeURIComponent(match[1]).replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(Array.from(atob(base64), char => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
      const parsed = JSON.parse(json);
      return typeof parsed === "object" && parsed ? parsed : null;
    } catch { return null; }
  }

  function getCardData() {
    const incoming = decodeHashData();
    if (incoming) {
      const data = { ...defaultData, ...incoming };
      sessionStorage.setItem(dataKey, JSON.stringify(data));
      return data;
    }
    try { return { ...defaultData, ...JSON.parse(sessionStorage.getItem(dataKey) || "{}") }; }
    catch { return defaultData; }
  }
  const cardData = getCardData();

  function showScreen(name) {
    screens.forEach(screen => screen.classList.toggle("active", screen.dataset.screen === name));
  }
  function applySound() {
    video1.muted = muted;
    video2.muted = muted;
    if (bgmGain && audioContext) {
      bgmGain.gain.setValueAtTime(muted ? 0 : bgmVolume, audioContext.currentTime);
    }
    soundToggle.setAttribute("aria-pressed", String(muted));
    soundToggle.setAttribute("aria-label", muted ? "Sound off" : "Sound on");
    soundToggle.innerHTML = `<span aria-hidden="true">${muted ? "🔇" : "🔊"}</span><span class="sound-label">Sound ${muted ? "OFF" : "ON"}</span>`;
  }
  function preloadBgm() {
    if (!bgmFetchPromise) {
      bgmFetchPromise = fetch(bgmUrl)
        .then(response => {
          if (!response.ok) throw new Error(`BGM fetch failed: ${response.status}`);
          return response.arrayBuffer();
        })
        .catch(error => {
          console.debug("BGM preload failed:", error);
          return null;
        });
    }
    return bgmFetchPromise;
  }
  function ensureAudioContext() {
    if (audioContext) return audioContext;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      audioContext = new AudioContextClass();
      bgmGain = audioContext.createGain();
      bgmGain.gain.value = muted ? 0 : bgmVolume;
      bgmGain.connect(audioContext.destination);
      if (audioContext.state === "running") {
        const suspended = audioContext.suspend();
        if (suspended && typeof suspended.catch === "function") {
          suspended.catch(error => console.debug("BGM context suspend failed:", error));
        }
      }
      return audioContext;
    } catch (error) {
      console.debug("BGM AudioContext setup failed:", error);
      return null;
    }
  }
  function decodeBgm() {
    if (bgmBuffer) return Promise.resolve(bgmBuffer);
    if (bgmDecodePromise) return bgmDecodePromise;
    const context = ensureAudioContext();
    if (!context) return Promise.resolve(null);
    bgmDecodePromise = preloadBgm()
      .then(data => data ? context.decodeAudioData(data.slice(0)) : null)
      .then(buffer => {
        bgmBuffer = buffer;
        return buffer;
      })
      .catch(error => {
        console.debug("BGM decode failed:", error);
        return null;
      });
    return bgmDecodePromise;
  }
  function startBgmIfReady() {
    if (!audioUnlocked || !bgmShouldPlay || muted || document.hidden || !audioContext || !bgmGain || !bgmBuffer || bgmSource) return;
    try {
      const source = audioContext.createBufferSource();
      source.buffer = bgmBuffer;
      source.loop = true;
      source.connect(bgmGain);
      source.onended = () => {
        if (bgmSource === source) bgmSource = null;
      };
      bgmStartedAt = audioContext.currentTime;
      source.start(0, bgmOffset % bgmBuffer.duration);
      bgmSource = source;
    } catch (error) {
      console.debug("BGM source start failed:", error);
    }
  }
  function unlockAndStartBgm() {
    const context = ensureAudioContext();
    if (!context) return;
    audioUnlocked = true;
    if (context.state !== "running") {
      const resumed = context.resume();
      if (resumed && typeof resumed.catch === "function") {
        resumed.catch(error => console.debug("BGM context resume failed:", error));
      }
    }
    startBgmIfReady();
    decodeBgm().then(() => startBgmIfReady());
  }
  function stopBgm(resetOffset = false) {
    if (bgmSource) {
      if (!resetOffset && bgmBuffer && audioContext) {
        bgmOffset = (bgmOffset + audioContext.currentTime - bgmStartedAt) % bgmBuffer.duration;
      }
      try { bgmSource.stop(); } catch { /* The source may already have ended. */ }
      bgmSource = null;
    }
    if (resetOffset) bgmOffset = 0;
  }
  async function playVideo(video) {
    try { await video.play(); } catch { /* Native controls are intentionally omitted to keep the framed experience simple. */ }
  }
  function resetVideos() {
    [video1, video2].forEach(video => {
      video.pause();
      try { video.currentTime = 0; } catch { /* Video metadata may not be available yet. */ }
    });
    candlesButton.classList.add("is-hidden");
    letterPrompt.hidden = true;
  }
  function stopAndResetBgm() {
    bgmShouldPlay = false;
    stopBgm(true);
  }
  function pauseAllMedia() {
    bgmShouldPlay = false;
    stopBgm();
    video1.pause();
    video2.pause();
  }
  function fitLetterText() {
    let size = Math.min(22, Math.max(12, window.innerWidth * 0.033));
    letterCopy.style.setProperty("--letter-size", `${size}px`);
    while (letterCopy.scrollHeight > letterCopy.clientHeight && size > 10) {
      size -= 0.5;
      letterCopy.style.setProperty("--letter-size", `${size}px`);
    }
  }
  function populateLetter() {
    document.querySelector("#recipientLine").textContent = `Dear ${cardData.recipientName},`;
    document.querySelector("#messageLine").textContent = cardData.message;
    document.querySelector("#senderLine").textContent = `From ${cardData.senderName}`;
    requestAnimationFrame(fitLetterText);
  }

  document.querySelector("#startButton").addEventListener("click", () => {
    started = true;
    bgmOffset = 0;
    bgmShouldPlay = !muted;
    // AudioContext resume stays directly in this user gesture for iOS/WebKit.
    if (!muted) {
      unlockAndStartBgm();
    }
    resetVideos();
    showScreen("video1");
    playVideo(video1);
  });
  video1.addEventListener("ended", () => candlesButton.classList.remove("is-hidden"));
  candlesButton.addEventListener("click", () => {
    candlesButton.classList.add("is-hidden");
    showScreen("video2");
    playVideo(video2);
  });
  video2.addEventListener("ended", () => { letterPrompt.hidden = false; });
  document.querySelector("#letterButton").addEventListener("click", () => {
    populateLetter();
    showScreen("letter");
  });
  document.querySelector("#replayButton").addEventListener("click", () => {
    resetVideos();
    stopAndResetBgm();
    started = false;
    showScreen("top");
  });
  soundToggle.addEventListener("click", () => {
    muted = !muted;
    applySound();
    if (!muted && started) {
      bgmShouldPlay = true;
      unlockAndStartBgm();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAllMedia();
  });
  window.addEventListener("pagehide", pauseAllMedia);
  window.addEventListener("resize", () => {
    if (document.querySelector('[data-screen="letter"]').classList.contains("active")) fitLetterText();
  });
  // Fetch immediately, then decode while the context is suspended before START when supported.
  preloadBgm();
  decodeBgm();
  applySound();
  populateLetter();
})();
