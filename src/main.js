import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import { loadFonts } from './plugins/webfontloader';
import i18n from './i18n';
import router from './router';
import store from './store'; // Import Vuex store
import axios from 'axios';

axios.defaults.withCredentials = true;

// Add response interceptor to handle expired sessions
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (Unauthorized) or 403 (Forbidden) responses
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('Session expired - clearing auth and redirecting to login');
      
      // Clear auth state
      localStorage.removeItem('auth_user');
      localStorage.removeItem('token');
      store.commit('LOGOUT');
      
      // Only redirect if we're not already on the login page
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
