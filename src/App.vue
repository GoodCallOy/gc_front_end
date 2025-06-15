<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();
</script>

<template>
  <v-app>
    <!-- Show Menu only if not on login page -->
    <Menu v-if="route.name !== 'login'" />

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
