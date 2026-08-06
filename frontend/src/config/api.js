// Same as As-market Frontend/config/api.js — API URL comes from app.json extra.
import Constants from 'expo-constants';

function stripTrailingSlash(url) {
  return String(url || '').replace(/\/$/, '');
}

export const API_BASE_URL = stripTrailingSlash(
  process.env.EXPO_PUBLIC_API_URL ||
    process.env.API_URL ||
    Constants.expoConfig?.extra?.API_URL ||
    'https://bet-app-dgqz.onrender.com'
);

if (__DEV__) {
  console.log('Quibet API_BASE_URL:', API_BASE_URL);
}

export default { API_BASE_URL };
