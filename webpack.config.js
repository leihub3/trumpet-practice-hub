const path = require('path');

module.exports = {
  // ...existing configuration...
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify"),
      "fs": require.resolve("browserify-fs")
    }
  },
  // ...existing configuration...
};
