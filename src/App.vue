<script setup>
import { ref } from 'vue';

// Import your components
import DashBoard from './components/dashBoard.vue';
import Agents from './components/agentsPage.vue';

// Define a map of navigation items to components
const componentsMap = {
  home: DashBoard,
  agents: Agents,
};

// Reactive state for the currently selected navigation item
const selectedItem = ref('home'); // Default to 'home'

// Reactive state for the drawer's open/close status
const isDrawerOpen = ref(true); // Tracks whether the drawer is expanded

// Function to handle navigation item selection
function selectItem(value) {
  selectedItem.value = value;
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
          title="DashBoard"
          value="home"
          @click="selectItem('home')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-multiple"
          title="Agents"
          value="agents"
          @click="selectItem('agents')"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content Area -->
    <v-main app>
      <!-- Dynamically load the selected component -->
      <component :is="componentsMap[selectedItem]" />
    </v-main>
  </v-app>
</template>

<style scoped>
</style>
