<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';

const isDrawerOpen = ref(true);
const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

function toggleLanguage() {
  locale.value = locale.value === 'en' ? 'fi' : 'en';
}

function navigateTo(value) {
  router.push({ name: value });
}
const logout = () => {
    window.location.href = "http://localhost:8080/login"; // Update for production
  };
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
        prepend-avatar="https://randomuser.me/api/portraits/women/85.jpg"
        subtitle="sandra_a88@gmail.com"
        title="Sandra Adams"
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
