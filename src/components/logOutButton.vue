<template>
    <button @click="logout">Logout</button>
  </template>
  
  <script setup>
  const logout = () => {
    window.location.href = "http://localhost:3030/user/logout"; // Update for production
  };
  </script>
  