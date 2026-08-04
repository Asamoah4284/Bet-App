const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Ensures the Shield VPN service permission is present after prebuild.
 * The module's AndroidManifest is merged by Gradle; this plugin is a no-op
 * marker so Expo lists betapp-shield as an installed plugin.
 */
function withBetappShield(config) {
  return withAndroidManifest(config, (config) => config);
}

module.exports = withBetappShield;
