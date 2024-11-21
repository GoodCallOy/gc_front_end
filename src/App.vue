<template>
  <v-app>
    <v-main>
      <v-container>
        <v-card>
          <v-card-title>Test Project</v-card-title>
          <v-card-text>
            This is a test project for Vuetify integration.
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="handleClick">Click Me</v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  methods: {
    handleClick() {
      alert('Button clicked!');
    },
  },
};
</script>
