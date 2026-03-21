const { VITE_API_BASE_URL, VITE_APP_NAME, VITE_LOGIN_EMAIL, VITE_LOGIN_PASS, VITE_DEBUG } = import.meta.env;
const API = VITE_API_BASE_URL || 'http://localhost:5000/api';

export const envConfig = {
  APP_NAME: VITE_APP_NAME || 'Investments Manager',
  API_BASE_URL: API,
  API_LOGIN_EMAIL: VITE_LOGIN_EMAIL || "",
  API_LOGIN_PASS: VITE_LOGIN_PASS || "",
  DEBUG: VITE_DEBUG === 'true',
} as const;
