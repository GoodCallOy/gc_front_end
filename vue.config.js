const { defineConfig } = require('@vue/cli-service');
const ESLintPlugin = require('eslint-webpack-plugin');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  configureWebpack: {
    plugins: [
      new ESLintPlugin({
        fix: true,
      }),
    ],
  },
  devServer: isDev
    ? (() => {
        const keyPath = 'C:/Users/Jason/server.key';
        const certPath = 'C:/Users/Jason/server.cert';
        const hasCertificates = fs.existsSync(keyPath) && fs.existsSync(certPath);
        
        return {
          server: hasCertificates
            ? {
                type: 'https',
                options: {
                  key: fs.readFileSync(keyPath),
                  cert: fs.readFileSync(certPath),
                },
              }
            : undefined,
          port: 8080,
        };
      })()
    : {},
  pluginOptions: {
    vuetify: {},
  },
});