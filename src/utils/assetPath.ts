/**
 * Helper function to safely get the asset URL considering Vite's base path for GitHub Pages
 */
export const getAssetUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${cleanBaseUrl}${cleanPath}`;
};
