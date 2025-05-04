<template>
    <v-row class="align-center">
      <v-avatar
        size="48"
        class="mr-4"
        :color="color"
        tile
        elevation="2"
      >
        <v-icon size="28" color="white">{{ icon }}</v-icon>
      </v-avatar>
      <div>
        <div class="text-subtitle-2 text-grey-darken-1">{{ title }}</div>
        <div class="text-h6 font-weight-bold">{{ value }}</div>
      </div>
    </v-row>
  </template>
  
  <script>
    export default {
        props: {
            icon: { type: String, required: true },
            color: { type: String, required: true },
            title: { type: String, required: true },
            value: { type: String, required: true }
        }
    }
</script>
  