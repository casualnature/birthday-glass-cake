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
    soundToggle.setAttribute("aria-pressed", String(muted));
    soundToggle.setAttribute("aria-label", muted ? "Sound off" : "Sound on");
    soundToggle.innerHTML = `<span aria-hidden="true">${muted ? "🔇" : "🔊"}</span><span class="sound-label">Sound ${muted ? "OFF" : "ON"}</span>`;
  }
  async function playBgm() {
    if (!started || muted) return;
    try { await bgm.play(); } catch { /* Browser policy can still prevent playback after a delayed action. */ }
  }
  async function playVideo(video) {
    try { await video.play(); } catch { /* Native controls are intentionally omitted to keep the framed experience simple. */ }
  }
  function resetMedia() {
    [video1, video2, bgm].forEach(media => { media.pause(); media.currentTime = 0; });
    candlesButton.classList.add("is-hidden");
    letterPrompt.hidden = true;
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
    resetMedia();
    showScreen("video1");
    playBgm();
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
    resetMedia();
    started = false;
    showScreen("top");
  });
  soundToggle.addEventListener("click", () => {
    muted = !muted;
    applySound();
    if (!muted) playBgm();
  });
  window.addEventListener("resize", () => {
    if (document.querySelector('[data-screen="letter"]').classList.contains("active")) fitLetterText();
  });
  applySound();
  populateLetter();
})();
