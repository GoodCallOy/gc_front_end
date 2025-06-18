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
    ? {
        server: {
          type: 'https',
          options: {
            key: fs.readFileSync('C:/Users/j_dan/server.key'),
            cert: fs.readFileSync('C:/Users/j_dan/server.cert'),
          },
        },
        port: 8080,
      }
    : {},
  pluginOptions: {
    vuetify: {},
  },
});