<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';

// Reactive state for the drawer's open/close status
const isDrawerOpen = ref(true); // Tracks whether the drawer is expanded

// Use vue-i18n for language switching
const { t, locale } = useI18n();

// Function to toggle the language between English and Finnish
function toggleLanguage() {
  locale.value = locale.value === 'en' ? 'fi' : 'en';
}

// Vue Router hooks for navigation
const router = useRouter();
const route = useRoute();

// Function to navigate to a page
function navigateTo(value) {
  router.push({ name: value });
}
</script>

<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      app
      rail
      width="256"
      rail-width="72"
      expand-on-hover
      v-model="isDrawerOpen"
    >
      <!-- User Info (Shown Only in Expanded Mode) -->
      <v-list v-if="isDrawerOpen">
        <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/women/85.jpg"
          subtitle="sandra_a88@gmail.com"
          title="Sandra Adams"
        ></v-list-item>
        <v-divider></v-divider>
      </v-list>

      <!-- Navigation Items -->
      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-laptop"
          :title="t('buttons.dashboard')"  
          :active="route.name === 'home'"
          @click="navigateTo('home')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-file-document"
          :title="t('buttons.cases')"  
          :active="route.name === 'cases'"
          @click="navigateTo('cases')"
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
        <!-- Language Toggle Button -->
        <v-list-item
          prepend-icon="mdi-earth"
          :title="t('buttons.language')"
          @click="toggleLanguage"
        >
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content Area -->
    <v-main app>
      <!-- Render the active route -->
      <router-view />
    </v-main>
  </v-app>
</template>

<style scoped>
/* Ensure the drawer behaves consistently with custom styles */
.v-navigation-drawer {
  z-index: 1000;
}

/* Adjust styles for small screens using media queries */
@media (max-width: 600px) {
  .v-navigation-drawer {
    position: absolute;
  }

  /* Ensure the drawer overlays content on small screens */
  .v-navigation-drawer--temporary {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }
}
</style>
