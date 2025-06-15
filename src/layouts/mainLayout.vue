<script setup>
import { onMounted} from 'vue';
import { useStore } from 'vuex';
import Menu from '@/components/menuBar.vue';

const store = useStore();

onMounted(async () => {
  await store.dispatch('fetchUser');
});

</script>

<template>
  <v-app>
    <Menu />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>