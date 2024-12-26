module.exports = {
    appId: 'com.frolickers.app',
    productName: 'FrolickersApp',
    directories: {
      output: 'dist',
    },
    files: [
      'dist/**/*',
      'node_modules/**/*',
      'package.json',
    ],
    extraMetadata: {
      main: 'dist/main/main.js',
    },
  };
  