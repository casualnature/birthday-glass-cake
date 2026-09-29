(() => {
  const limits = { recipientName: 30, message: 200, senderName: 40 };
  const defaults = {
    recipientName: "Emily",
    message: "Wishing you a wonderful birthday filled with happiness and love.",
    senderName: "John"
  };
  const fields = Object.fromEntries(Object.keys(limits).map(key => [key, document.querySelector(`#${key}`)]));
  const errorElements = {
    recipientName: document.querySelector("#recipientError"),
    message: document.querySelector("#messageError"),
    senderName: document.querySelector("#senderError")
  };
  const messageCount = document.querySelector("#messageCount");
  const giftLink = document.querySelector("#giftLink");
  const giftLinkSection = document.querySelector("#giftLinkSection");
  const copyStatus = document.querySelector("#copyStatus");

  Object.entries(defaults).forEach(([key, value]) => { fields[key].value = value; });

  function encodeData(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  function cardBaseUrl() {
    return new URL("../", window.location.href).toString();
  }
  function updateMessageCount() {
    messageCount.textContent = `${fields.message.value.length} / ${limits.message}`;
  }
  function setError(key, message) {
    errorElements[key].textContent = message;
    fields[key].closest(".field-group").classList.toggle("has-error", Boolean(message));
  }
  function validate() {
    let valid = true;
    Object.entries(limits).forEach(([key, limit]) => {
      const value = fields[key].value;
      let message = "";
      if (!value.trim()) message = "This field is required.";
      else if (value.length > limit) message = `Please use ${limit} characters or fewer.`;
      setError(key, message);
      if (message) valid = false;
    });
    return valid;
  }
  function getGiftUrl(preview) {
    const data = Object.fromEntries(Object.keys(limits).map(key => [key, fields[key].value]));
    const url = new URL(cardBaseUrl());
    if (preview) url.searchParams.set("preview", "1");
    url.hash = `d=${encodeData(data)}`;
    return url.toString();
  }
  function generateGiftUrl() {
    if (!validate()) return null;
    const url = getGiftUrl(false);
    giftLink.value = url;
    giftLinkSection.hidden = false;
    copyStatus.textContent = "";
    return url;
  }

  Object.entries(fields).forEach(([key, field]) => {
    field.addEventListener("input", () => {
      if (key === "message") updateMessageCount();
      const overLimit = field.value.length > limits[key];
      setError(key, overLimit ? `Please use ${limits[key]} characters or fewer.` : "");
    });
  });
  document.querySelector("#previewButton").addEventListener("click", () => {
    if (!validate()) return;
    window.open(getGiftUrl(true), "_blank", "noopener");
  });
  document.querySelector("#generateButton").addEventListener("click", generateGiftUrl);
  document.querySelector("#copyButton").addEventListener("click", async () => {
    const url = generateGiftUrl();
    if (!url) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      copyStatus.textContent = "Gift link copied!";
    } catch {
      giftLink.focus();
      giftLink.select();
      copyStatus.textContent = "Copy is unavailable here. The gift link is selected so you can copy it manually.";
    }
  });
  document.querySelector("#openButton").addEventListener("click", () => {
    const url = generateGiftUrl();
    if (url) window.open(url, "_blank", "noopener");
  });
  updateMessageCount();
})();
