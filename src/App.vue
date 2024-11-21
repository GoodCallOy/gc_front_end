<script setup>
import menuBar from './components/menuBar.vue';
import DashBoard from './components/dashBoard.vue';
import AboutPage from './components/aboutPage.vue';

import { ref } from 'vue';

// Register your components
const componentsMap = {
  Home: DashBoard,
  About: AboutPage,
};

// Define a reactive variable for the active component
const activeComponent = ref('Home');

// Function to update the active component
function updateComponent(componentName) {
  activeComponent.value = componentName;
}
</script>

<template>
  <div class="layout">
    <aside class="menu-bar">
      <menuBar @menu-item-click="updateComponent" />
    </aside>

    <div class="content">
      <!-- Dynamically load the component -->
      <component :is="componentsMap[activeComponent]" />
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh; /* Full viewport height */
}

.menu-bar {
  width: 255px;
  background-color: #2c3e50;
  color: white;
  padding: 0; /* Ensure no unexpected padding */
  box-sizing: border-box;
  overflow-y: auto; /* Add a scrollbar if content overflows */
}

.content {
  flex-grow: 1;
  padding: 20px;
}
</style>