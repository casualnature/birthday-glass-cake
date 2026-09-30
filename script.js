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
  const bgm = document.querySelector("#bgm");
  const soundToggle = document.querySelector("#soundToggle");
  const candlesButton = document.querySelector("#candlesButton");
  const letterPrompt = document.querySelector("#letterPrompt");
  const letterCopy = document.querySelector("#letterCopy");
  let started = false;
  // A new visit always starts Sound ON. The in-memory value persists through every card screen and Replay.
  let muted = false;

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
    bgm.muted = muted;
    video1.muted = muted;
    video2.muted = muted;
    if (muted) bgm.pause();
    soundToggle.setAttribute("aria-pressed", String(muted));
    soundToggle.setAttribute("aria-label", muted ? "Sound off" : "Sound on");
    soundToggle.innerHTML = `<span aria-hidden="true">${muted ? "🔇" : "🔊"}</span><span class="sound-label">Sound ${muted ? "OFF" : "ON"}</span>`;
  }
  function playBgm() {
    if (!started || muted) return;
    bgm.muted = false;
    const playback = bgm.play();
    if (playback) playback.catch(() => { /* Browser policy can still prevent playback. */ });
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
    bgm.pause();
    if (bgm.readyState > 0) {
      try { bgm.currentTime = 0; } catch { /* Seeking can be unavailable while media initializes. */ }
    }
  }
  function pauseAllMedia() {
    bgm.pause();
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
    // Keep play() directly in this user gesture for iOS/WebKit audio authorization.
    if (!muted) {
      bgm.muted = false;
      const playback = bgm.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(error => console.debug("BGM play rejected:", error?.name, error?.message));
      }
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
      bgm.muted = false;
      const playback = bgm.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(error => console.debug("BGM play rejected:", error?.name, error?.message));
      }
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAllMedia();
  });
  window.addEventListener("pagehide", pauseAllMedia);
  window.addEventListener("resize", () => {
    if (document.querySelector('[data-screen="letter"]').classList.contains("active")) fitLetterText();
  });
  applySound();
  populateLetter();
})();
