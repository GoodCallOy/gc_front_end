<template>
    <button @click="logout">Logout</button>
  </template>
  
  <script setup>
  const logout = () => {
    window.location.href = "http://localhost:8080/auth/logout"; // Update for production
  };
  </script>
  