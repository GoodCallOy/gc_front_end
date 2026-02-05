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
        // Read SSL paths from environment so each machine can configure its own
        const keyPath = process.env.SSL_KEY_PATH;
        const certPath = process.env.SSL_CERT_PATH;

        const hasCertificates =
          !!keyPath &&
          !!certPath &&
          fs.existsSync(keyPath) &&
          fs.existsSync(certPath);

        if (!hasCertificates) {
          // Optional: log a message in the dev server console when falling back
          // eslint-disable-next-line no-console
          console.warn(
            '[devServer] SSL certificates not found or paths not set. Falling back to HTTP on port 8080.'
          );
        }

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