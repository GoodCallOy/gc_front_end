<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const isDrawerOpen = ref(true);
const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const user = ref(null); // Stores user data

function toggleLanguage() {
  locale.value = locale.value === 'en' ? 'fi' : 'en';
}

function navigateTo(value) {
  router.push({ name: value });
}

const logout = () => {
  const BASE_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:8080/login"
      : "https://goodcall-front-end.onrender.com/login";

  window.open(BASE_URL, "_self"); // Redirects to login page
};

// Fetch user data on component mount if authenticated
const fetchUserData = async () => {
  try {
    const response = await axios.get("https://goodcall.fi/api/v1/auth/user", { withCredentials: true });
    user.value = response.data;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
  }
};

// After Google login is successful, call this to fetch user data
// const handleGoogleLogin = async () => {
//   try {
//     await fetchUserData(); // Fetch user data after login
//   } catch (error) {
//     console.error("Error fetching user data after Google login:", error);
//   }
// };

// Ensure the user data is fetched when the component mounts if logged in
onMounted(() => {
  // Check if user is logged in (can be done using a session or token check)
  const isLoggedIn = localStorage.getItem("user"); // or use cookies/session
  console.log('isLoggedIn', isLoggedIn);
  if (isLoggedIn) {
    fetchUserData();
  }
});

</script>

<template>
  <v-navigation-drawer
    app
    rail
    width="256"
    rail-width="72"
    expand-on-hover
    v-model="isDrawerOpen"
  >
    <v-list v-if="isDrawerOpen">
      <v-list-item
        v-if="user"
        :prepend-avatar="user.avatar || 'https://randomuser.me/api/portraits/women/85.jpg'"
        :subtitle="user.email"
        :title="user.name"
      ></v-list-item>
      <v-divider></v-divider>
    </v-list>

    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-laptop"
        :title="t('buttons.dashboard')"  
        :active="route.name === 'home'"
        @click="navigateTo('home')"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-account-multiple"
        :title="t('buttons.agents')"  
        :active="route.name === 'agents'"
        @click="navigateTo('agents')"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-folder-plus"
        :title="t('buttons.addCase')"  
        :active="route.name === 'addCase'"
        @click="navigateTo('addCase')"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-account-plus"
        :title="t('buttons.addAgent')"  
        :active="route.name === 'addAgent'"
        @click="navigateTo('addAgent')"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-account-plus"
        :title="t('buttons.addAgentStats')"  
        :active="route.name === 'addAgentStats'"
        @click="navigateTo('addAgentStats')"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-account-plus"
        :title="t('buttons.addAgentGoals')"  
        :active="route.name === 'addAgentGoals'"
        @click="navigateTo('addAgentGoals')"
      ></v-list-item>
      <v-divider></v-divider>
      <v-list-item
        prepend-icon="mdi-earth"
        :title="t('buttons.language')"
        @click="toggleLanguage"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-logout"
        :title="t('buttons.logout')"  
        @click="logout"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
