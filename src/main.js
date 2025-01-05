import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import { loadFonts } from './plugins/webfontloader';
import i18n from './i18n';
import router from './router';
import store from './store'; // Import Vuex store

loadFonts();

createApp(App)
  .use(i18n)
  .use(vuetify)
  .use(router)
  .use(store) // Register Vuex store
  .mount('#app');
