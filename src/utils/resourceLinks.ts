const HTTP_URL_PATTERN = /^https?:\/\//i;

export function getResourceOpenUrl(resource: any): string | null {
  const candidate = resource?.openUrl
    || resource?.fileUrl
    || resource?.pdfDownloadUrl
    || resource?.downloadUrl
    || resource?.googleDriveLink;

  if (!candidate || !HTTP_URL_PATTERN.test(String(candidate))) return null;
  return String(candidate);
}

export function openResourceInNewTab(resource: any): boolean {
  const url = getResourceOpenUrl(resource);
  if (!url) return false;

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) window.location.assign(url);
  return true;
}
