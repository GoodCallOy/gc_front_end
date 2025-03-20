<template>
    <div class="login-container">
      <h2>Login</h2>
      <GoogleLoginButton />
    </div>
  </template>
  
  <script setup>
  import GoogleLoginButton from "@/components/googleLoginButton.vue";
  </script>
  
  <style scoped>
  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 50vh;
  }
  </style>
  