<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

// Import your components
import DashBoard from './components/dashBoard.vue';
import Agents from './components/agentsPage.vue';
import AddAgent from './components/addAgentStats.vue';
import AddCase from './components/addCase.vue';
import Cases from './components/casesPage.vue';

// Define a map of navigation items to components
const componentsMap = {
  home: DashBoard,
  agents: Agents,
  addAgent: AddAgent,
  addCase: AddCase,
  cases: Cases,
};

// Reactive state for the currently selected navigation item
const selectedItem = ref('home'); // Default to 'home'

// Reactive state for the drawer's open/close status
const isDrawerOpen = ref(true); // Tracks whether the drawer is expanded

// Function to handle navigation item selection
function selectItem(value) {
  selectedItem.value = value;
}

// Use vue-i18n for language switching
const { t, locale } = useI18n();

// Function to toggle the language between English and Finnish
function toggleLanguage() {
  locale.value = locale.value === 'en' ? 'fi' : 'en';
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
          value="home"
          @click="selectItem('home')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-file-document"
          :title="t('buttons.cases')"  
          value="cases"
          @click="selectItem('cases')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-multiple"
          :title="t('buttons.agents')"  
          value="agents"
          @click="selectItem('agents')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-folder-plus"
          :title="t('buttons.addCase')"  
          value="addCase"
          @click="selectItem('addCase')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-plus"
          :title="t('buttons.addAgent')"  
          value="addAgent"
          @click="selectItem('addAgent')"
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
      <!-- Dynamically load the selected component -->
      <component 
        :is="componentsMap[selectedItem]" 
      />
      
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
