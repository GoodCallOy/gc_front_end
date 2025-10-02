<template>
  <v-btn @click="loginWithGoogle" class="google-button" prepend-icon="mdi-google">
    <template v-slot:prepend>
      <v-icon color="primary" class="google-logo"></v-icon>
    </template>
    Login with Google
  </v-btn>
</template>

<script setup>
import urls from "@/js/config.js";
const loginWithGoogle = () => {
  console.log("Logging in with Google...")
  const target = `${urls.backEndURL}/auth/google`;
  const ua = navigator.userAgent || '';
  const isFirefox = /Firefox\/\d+/.test(ua) && !/Seamonkey\/\d+/.test(ua);
  if (isFirefox) {
    // Use top-level navigation for Firefox to avoid cookie/popup restrictions
    window.location.assign(target);
  } else {
    window.open(target, "_self");
  }
};
</script>

<style scoped>
.google-button {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border: none;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  font-size: 18px;
}

.google-logo {
  width: 20px;
  margin-right: 10px;
}
</style>
