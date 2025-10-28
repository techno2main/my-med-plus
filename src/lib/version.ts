// Version automatique générée à chaque build
declare global {
  const __BUILD_TIMESTAMP__: string;
}

export const BUILD_VERSION = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : Date.now().toString();
export const VERSION_CHECK_URL = '/version.json';