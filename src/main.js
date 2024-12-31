import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import i18n from './i18n';
import router from './router';

loadFonts()

createApp(App)
  .use(i18n) 
  .use(vuetify) 
  .use(router)
  .mount('#app');
