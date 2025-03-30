<template>
  <v-btn @click="loginWithGoogle" class="google-button" prepend-icon="mdi-google">
    <template v-slot:prepend>
      <v-icon color="primary" class="google-logo"></v-icon>
    </template>
    Login with Google
  </v-btn>
</template>

<script setup>
const loginWithGoogle = () => {
  const BASE_URL =
    window.location.hostname === "localhost"
      ? "https://goodcall.fi/api/v1/auth/google"
      : "https://goodcall.fi/api/v1/auth/google";

  window.open(BASE_URL, "_self"); // Redirects to backend authentication
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
