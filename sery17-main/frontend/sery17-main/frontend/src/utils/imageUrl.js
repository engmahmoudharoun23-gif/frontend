// Image URL helper: handles base64 (legacy), relative API paths, and full URLs.
// For API paths like "/api/images/xxx", appends ?auth=<token> for img tags.
export function resolveImageUrl(input) {
  if (!input) return '';
  const str = String(input);
  // legacy base64 (before refactor) - return as-is
  if (str.startsWith('data:')) return str;
  // full URL - return as-is
  if (str.startsWith('http://') || str.startsWith('https://')) return str;
  
  const token = localStorage.getItem('token') || '';
  const backend = process.env.REACT_APP_BACKEND_URL || '';
  
  // Storage URL like /api/images/xxx
  if (str.startsWith('/api/')) {
    const sep = str.includes('?') ? '&' : '?';
    return `${backend}${str}${sep}auth=${encodeURIComponent(token)}`;
  }
  // Other relative path
  if (str.startsWith('/')) {
    return `${backend}${str}`;
  }
  return str;
}

export function isVideo(input) {
  if (!input) return false;
  const str = String(input).toLowerCase();
  return str.includes('.webm') || str.includes('.mp4') || str.includes('.mov') || str.includes('.avi') || str.includes('video/');
}
