<template>
  <v-app>
    <!-- Menu for navigation items -->
    <v-navigation-drawer app>
      <v-list>
        <v-list-item v-for="(item, index) in items" :key="index">
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main content area -->
    <v-main>
      <!-- Language switcher buttons -->
      <div class="d-flex justify-center mt-4">
        <v-btn @click="switchLanguage('en')" class="mx-3">English</v-btn>
        <v-btn @click="switchLanguage('fi')" class="mx-3">Finnish</v-btn>
      </div>

      <!-- Rest of your content (dashboard, etc.) -->
      <div class="d-flex flex-column align-center" style="height: 100vh;">
        <h1>{{ $t('dashboard.title') }}</h1>

        <div class="d-flex flex-row align-center ma-5">
          <!-- Example of your other menu buttons here -->
          <v-btn class="mx-3" @click="handleClick">{{ $t('buttons.close') }}</v-btn>
        </div>

        <!-- Additional content -->
        <p>{{ $t('dashboard.cases') }}</p>
      </div>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      items: [
        { text: this.$t('dashboard.title'), icon: 'mdi-folder' },
        { text: this.$t('dashboard.cases'), icon: 'mdi-account-multiple' },
        { text: this.$t('dashboard.agents'), icon: 'mdi-star' },
        { text: this.$t('dashboard.language'), icon: 'mdi-star' },
        { text: 'Add Agent', icon: 'mdi-account-plus' },
        { text: 'About', icon: 'mdi-history' },
      ],
    };
  },
  methods: {
    handleClick() {
      alert('Button clicked!');
    },
    switchLanguage(language) {
      this.$i18n.locale = language;
    },
  },
};
</script>
