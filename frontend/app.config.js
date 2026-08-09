const appJson = require('./app.json');

/**
 * Same pattern as As-market: API_URL comes from env / app config extra.
 * In Expo Go (__DEV__), src/config/api.js prefers the Metro host:3000 so phones hit your PC.
 *
 * Google Sign-In on iOS also needs iosUrlScheme (reversed iOS client ID), e.g.
 * EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.1234567890-abcdef
 */
module.exports = ({ config }) => {
  const base = appJson.expo || config;
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.API_URL ||
    base.extra?.API_URL ||
    'https://bet-app-dgqz.onrender.com';

  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME || '';
  const plugins = (base.plugins || []).map((plugin) => {
    if (plugin === '@react-native-google-signin/google-signin' && iosUrlScheme) {
      return [
        '@react-native-google-signin/google-signin',
        { iosUrlScheme },
      ];
    }
    if (Array.isArray(plugin) && plugin[0] === '@react-native-google-signin/google-signin' && iosUrlScheme) {
      return [
        '@react-native-google-signin/google-signin',
        { ...(plugin[1] || {}), iosUrlScheme },
      ];
    }
    return plugin;
  });

  return {
    ...base,
    ...config,
    plugins,
    extra: {
      ...(base.extra || {}),
      ...(config.extra || {}),
      API_URL: apiUrl,
    },
  };
};
