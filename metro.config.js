const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  return {
    ...defaultConfig,
    resolver: {
      ...defaultConfig.resolver,
      assetExts: [
        ...defaultConfig.resolver.assetExts,
        "cjs",
        "ttf",
        "woff",
        "woff2",
      ],
    },
  };
})();
