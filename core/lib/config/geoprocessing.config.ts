/**
 * Geoprocessing API Configuration
 * Centralized configuration for geoprocessing service endpoints
 *
 * IMPORTANT:
 * - Process API (OGC): Direct to http://192.168.18.169 (no proxy)
 * - Catalog API: Through Apollo proxy http://localhost:3002
 */

export const GEOPROCESSING_CONFIG = {
  // Direct OGC API URL (for geoprocessing processes)
  OGC_BASE_URL: "http://192.168.18.169",

  // Apollo Proxy URL (for catalog/data API only)
  PROXY_BASE_URL: "http://localhost:3002",

  // Catalog Explorer endpoints (via direct connection)
  SERVERS_ENDPOINT: "/catalogexplorer/api/user/geoprocessing/servers",

  // OGC API - Processes endpoints (direct, no proxy)
  PROCESSES_ENDPOINT: "/oapi-p/processes",

  // Query parameters
  SERVERS_QUERY: "?size=100&page=0&sort=name",
};

/**
 * Build full OGC API endpoint URL (direct connection)
 */
export const buildOgcUrl = (endpoint: string): string => {
  const baseUrl = GEOPROCESSING_CONFIG.OGC_BASE_URL.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

/**
 * Get servers API URL (direct to catalogexplorer)
 */
export const getServersUrl = (): string => {
  return buildOgcUrl(
    `${GEOPROCESSING_CONFIG.SERVERS_ENDPOINT}${GEOPROCESSING_CONFIG.SERVERS_QUERY}`
  );
};

/**
 * Get processes API URL (direct to OGC API)
 */
export const getProcessesUrl = (): string => {
  return buildOgcUrl(GEOPROCESSING_CONFIG.PROCESSES_ENDPOINT);
};

/**
 * Get specific process details URL (direct to OGC API)
 */
export const getProcessDetailsUrl = (processId: string): string => {
  return buildOgcUrl(
    `${GEOPROCESSING_CONFIG.PROCESSES_ENDPOINT}/${processId}`
  );
};

/**
 * Get process execution URL (direct to OGC API)
 */
export const getProcessExecutionUrl = (processId: string): string => {
  return buildOgcUrl(
    `${GEOPROCESSING_CONFIG.PROCESSES_ENDPOINT}/${processId}/execution`
  );
};

/**
 * Get WMS preview URL (via Apollo proxy)
 */
export const getWmsPreviewUrl = (dataId: string): string => {
  const baseUrl = GEOPROCESSING_CONFIG.PROXY_BASE_URL.replace(/\/$/, "");
  return `${baseUrl}/apollo/ogc/wms/preview_data_${dataId}`;
};
