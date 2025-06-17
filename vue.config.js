const fs = require('fs');
const { defineConfig } = require('@vue/cli-service');

const isDev = process.env.NODE_ENV === 'development';

module.exports = defineConfig({
  transpileDependencies: true,

  devServer: isDev
    ? {
        https: {
          key: fs.readFileSync('C:/Users/j_dan/server.key'),
          cert: fs.readFileSync('C:/Users/j_dan/server.cert'),
        },
        port: 8080,
      }
    : {},

  pluginOptions: {
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    }
  }
});