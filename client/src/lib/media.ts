import { API_URL } from "@/lib/api";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function normalizeMediaUrl(fileUrl?: string | null) {
  if (!fileUrl) {
    return "";
  }

  if (
    fileUrl.startsWith("blob:") ||
    fileUrl.startsWith("data:") ||
    fileUrl.startsWith("http://") ||
    fileUrl.startsWith("https://")
  ) {
    return fileUrl;
  }

  if (fileUrl.startsWith("/")) {
    return `${API_ORIGIN}${fileUrl}`;
  }

  return `${API_ORIGIN}/${fileUrl}`;
}

export function isLocalUploadUrl(fileUrl?: string | null) {
  const normalizedUrl = normalizeMediaUrl(fileUrl);

  return normalizedUrl.startsWith(`${API_ORIGIN}/uploads/`);
}
