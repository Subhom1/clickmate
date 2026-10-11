const { getDefaultConfig } = require("expo/metro-config");

// Expo's defaults already support the app's fonts and treat .cjs as code.
module.exports = getDefaultConfig(__dirname);
