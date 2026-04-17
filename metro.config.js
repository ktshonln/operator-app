const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Customize the config before returning it.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
