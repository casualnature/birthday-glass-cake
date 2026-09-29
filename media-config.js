// Cloudflare R2 media configuration
// Development-only R2 URL. Set R2_MEDIA_BASE_URL to this value temporarily when testing R2 directly.
const R2_DEVELOPMENT_MEDIA_BASE_URL = "https://pub-cf6f169b434044d8b58a2921f1cc062d.r2.dev";
// Production: the isolated Pages Function serves the videos from the bound R2 bucket.
const R2_MEDIA_BASE_URL = "/media";
// Local browser testing keeps using the checked-out video files without a Pages Function.
const useLocalVideoFiles = location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname);

const normalizedMediaBaseUrl = useLocalVideoFiles ? "" : R2_MEDIA_BASE_URL.replace(/\/+$/, "");
const VIDEO_1_URL = normalizedMediaBaseUrl
  ? `${normalizedMediaBaseUrl}/video-1.mp4`
  : "assets/video-1.mp4";
const VIDEO_2_URL = normalizedMediaBaseUrl
  ? `${normalizedMediaBaseUrl}/video-2.mp4`
  : "assets/video-2.mp4";

window.BirthdayGlassCakeMedia = Object.freeze({ VIDEO_1_URL, VIDEO_2_URL });
