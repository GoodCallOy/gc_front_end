import { createApp } from 'vue';
import '@/styles/percentageBadges.css';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import { loadFonts } from './plugins/webfontloader';
import i18n from './i18n';
import router from './router';
import store from './store'; // Import Vuex store
import axios from 'axios';

axios.defaults.withCredentials = true;

// Only 401 means the session is gone. 403 is "logged in, not allowed"
// (for example frozen daily logs) and must not kick the user to login.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired - clearing auth and redirecting to login');

      localStorage.removeItem('auth_user');
      localStorage.removeItem('token');
      store.commit('LOGOUT');

      if (router.currentRoute.value.name !== 'login') {
        router.replace({ name: 'login' });
      }
    }
    return Promise.reject(error);
  }
);

loadFonts();

createApp(App)
  .use(i18n)
  .use(vuetify)
  .use(router)
  .use(store) // Register Vuex store
  .mount('#app');
