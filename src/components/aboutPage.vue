<template>
    <div class="d-flex flex-column align-center" style="height: 100vh; ">
      <h1 class="mb-5 mt-5">About Page</h1>
      <p>This is the About Page content.</p>
    </div>
    <v-btn @click="isDrawerOpen = !isDrawerOpen">Toggle Drawer</v-btn>
  </template>
  
  <script>
  export default {
    name: 'AboutPage',
  };
  </script>
  