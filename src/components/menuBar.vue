<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const isDrawerOpen = ref(true);
const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

const BASE_URL =
      window.location.hostname === 'localhost'
        ? 'http://localhost:8080/login'
        : 'https://goodcall-front-end.onrender.com/login'



const store = useStore() // Access Vuex store
const user = computed(() => store.state.user)

function toggleLanguage() {
  locale.value = locale.value === 'en' ? 'fi' : 'en';
}

function navigateTo(value) {
  router.push({ name: value });
}

const logout = async () => {
  try {
    await axios.get(`${BASE_URL}/auth/logout`, { withCredentials: true })

    store.commit('LOGOUT') // Clear user from Vuex

    // Redirect manually after logout
    
    window.location.href = BASE_URL
  } catch (error) {
    console.error('Logout failed:', error)
  }
}



// Ensure the user data is fetched when the component mounts if logged in
onMounted(() => {
  
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
        :prepend-avatar="user.avatar"
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
        prepend-icon="mdi-laptop"
        :title="t('buttons.dashboard2')"  
        :active="route.name === 'dash2'"
        @click="navigateTo('dash2')"
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
      <v-list-item
        prepend-icon="mdi-account-plus"
        :title="t('buttons.addAgentCaseInfo')"  
        :active="route.name === 'addAgentCaseInfo'"
        @click="navigateTo('addAgentCaseInfo')"
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
