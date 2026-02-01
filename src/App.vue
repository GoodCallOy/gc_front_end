<script setup>
</script>

<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<style>
/* Remove default margins and padding that cause gaps */
html, body {
  margin: 0 !important;
  padding: 0 !important;
}

#app {
  margin: 0 !important;
  padding: 0 !important;
}

/* Remove top padding from v-main */
.v-main {
  padding-top: 0 !important;
}

/* Remove any default padding from v-main__wrap */
.v-main__wrap {
  padding-top: 0 !important;
}
</style>