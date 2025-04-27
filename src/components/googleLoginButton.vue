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
  window.open(`${urls.backEndURL}/auth/google`, "_self"); // Redirects to backend authentication
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
