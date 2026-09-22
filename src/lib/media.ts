const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogv", ".ogg"];

export function isVideoUrl(url: string): boolean {
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
}
