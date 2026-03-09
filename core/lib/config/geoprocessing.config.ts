/**
 * Geoprocessing API Configuration
 * Centralized configuration for geoprocessing service endpoints
 * Uses Apollo Proxy Server on localhost:3001
 */

export const GEOPROCESSING_CONFIG = {
  // Proxy server base URL
  PROXY_BASE_URL: "http://localhost:3001",

  // Catalog Explorer endpoints (via geoprocessing proxy)
  SERVERS_ENDPOINT: "/geoprocessing/catalogexplorer/api/user/geoprocessing/servers",

  // OGC API - Processes endpoints (via ogc proxy)
  PROCESSES_ENDPOINT: "/ogc/processes",

  // Query parameters
  SERVERS_QUERY: "?size=100&page=0&sort=name",
};

/**
 * Build full proxy API endpoint URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = GEOPROCESSING_CONFIG.PROXY_BASE_URL.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

/**
 * Get servers API URL (via geoprocessing proxy)
 */
export const getServersUrl = (): string => {
  return buildApiUrl(
    `${GEOPROCESSING_CONFIG.SERVERS_ENDPOINT}${GEOPROCESSING_CONFIG.SERVERS_QUERY}`
  );
};

/**
 * Get processes API URL (via OGC proxy)
 */
export const getProcessesUrl = (): string => {
  return buildApiUrl(GEOPROCESSING_CONFIG.PROCESSES_ENDPOINT);
};

/**
 * Get specific process details URL (via OGC proxy)
 */
export const getProcessDetailsUrl = (processId: string): string => {
  return buildApiUrl(
    `${GEOPROCESSING_CONFIG.PROCESSES_ENDPOINT}/${processId}`
  );
};

/**
 * Get process execution URL (via OGC proxy)
 */
export const getProcessExecutionUrl = (processId: string): string => {
  return buildApiUrl(
    `${GEOPROCESSING_CONFIG.PROCESSES_ENDPOINT}/${processId}/execution`
  );
};
