/**
 * Centralized Application Configuration
 * 
 * To change the hostname or context path for all environments,
 * modify the values in the `configs` object below.
 */

const environment = 'development'; // 'development', 'production', etc.

const configs = {
  development: {
    hostname: 'http://localhost:8080',
    contextPath: '/devtrack',
  },
  production: {
    hostname: 'https://api.production.com', // Change this for production
    contextPath: '/devtrack',
  }
};

// Default to development if environment not found
const currentConfig = configs[environment] || configs.development;

export const APP_CONFIG = {
  ...currentConfig,
  apiUrl: `${currentConfig.hostname}${currentConfig.contextPath}`,
};

export default APP_CONFIG;
