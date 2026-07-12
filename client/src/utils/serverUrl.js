/**
 * Server origin for icon/embed URLs.
 * Local: VITE_API_URL=/api/v1 → '' (Vite proxies /icons)
 * Prod:  VITE_API_URL=https://your-api.vercel.app/api/v1 → https://your-api.vercel.app
 */
export const getServerOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
  if (/^https?:\/\//i.test(apiUrl)) {
    return apiUrl.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '');
  }
  return '';
};

/** Build a full /icons?... URL against the API host. */
export const buildIconUrl = (params) => {
  const query =
    typeof params === 'string'
      ? params.replace(/^\?/, '')
      : new URLSearchParams(params).toString();
  const path = `/icons?${query}`;
  const origin = getServerOrigin();
  return origin ? `${origin}${path}` : path;
};

/** Resolve API-relative paths like /uploads/... for <img src>. */
export const resolveServerUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const origin = getServerOrigin();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return origin ? `${origin}${normalized}` : normalized;
};
