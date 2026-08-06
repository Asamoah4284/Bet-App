const appJson = require('./app.json');

/**
 * Same pattern as As-market: API_URL comes from env / app config extra.
 * In Expo Go (__DEV__), src/config/api.js prefers the Metro host:3000 so phones hit your PC.
 */
module.exports = ({ config }) => {
  const base = appJson.expo || config;
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.API_URL ||
    base.extra?.API_URL ||
    'https://bet-app-dgqz.onrender.com';

  return {
    ...base,
    ...config,
    extra: {
      ...(base.extra || {}),
      ...(config.extra || {}),
      API_URL: apiUrl,
    },
  };
};
