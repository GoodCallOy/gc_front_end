const fs = require('fs');
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    https: {
      key: fs.readFileSync('C:/Users/j_dan/server.key'),
      cert: fs.readFileSync('C:/Users/j_dan/server.cert'),
    },
    port: 8080, // or your preferred port
  },

  pluginOptions: {
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    }
  }
});