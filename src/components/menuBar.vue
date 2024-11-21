<template>
    <v-card
      class="mx-auto"
      width="250"
    >
      <v-layout>
        <v-navigation-drawer absolute permanent>
          <v-list>
            <v-list-item
              prepend-avatar="https://cdn.vuetifyjs.com/images/john.png"
              subtitle="john@google.com"
              title="John Leider"
            >
              <template v-slot:append>
                <v-btn
                  icon="mdi-menu-down"
                  size="small"
                  variant="text"
                ></v-btn>
              </template>
            </v-list-item>
          </v-list>
  
          <v-divider></v-divider>
  
          <v-list
            :lines="false"
            density="compact"
            nav
          >
            <v-list-item
              v-for="(item, i) in items"
              :key="i"
              :value="item"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon :icon="item.icon"></v-icon>
              </template>
  
              <v-list-item-title v-text="item.text"></v-list-item-title>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>
  
        <v-main style="height: 300px;"></v-main>
      </v-layout>
    </v-card>
  </template>

<script>
export default {
  name: 'App',
  data: () => ({
      items: [
        { text: 'DashBoard', icon: 'mdi-folder' },
        { text: 'Cases', icon: 'mdi-account-multiple' },
        { text: 'Agents', icon: 'mdi-star' },
        { text: 'about', icon: 'mdi-history' },
      ],
    }),
  methods: {
    handleClick() {
      alert('Button clicked!');
    },
  },
};
</script>

<style scoped>
.menu-bar {
  height: 100%; /* Ensure it takes up the full height of the parent */
  box-sizing: border-box; /* Include padding and borders in height/width */
  overflow-y: auto; /* Add a scrollbar if the content overflows */
  padding: 10px; /* Padding inside the menu */
  color: white;
  background-color: #2c3e50;
}

ul {
  list-style-type: none; /* Remove bullet points */
  padding: 0;
  margin: 0;
}

li {
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

li:hover {
  background-color: #34495e;
}
</style>