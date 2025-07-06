<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const isDrawerOpen = ref(true);

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

const BASE_URL =
      window.location.hostname === 'localhost'
        ? 'https://localhost:8080/login'
        : 'https://goodcall-front-end.onrender.com/login'

const store = useStore() // Access Vuex store
const user = computed(() => store.state.user)

const dashboardOpen = ref(false)
const agentsOpen = ref(false)
const formsOpen = ref(false)
const ordersOpen = ref(false)
const oldLinksOpen = ref(false)

function closeAllGroups() {
  console.log('Closing all groups in menuBar')
  dashboardOpen.value = false
  agentsOpen.value = false
  formsOpen.value = false
  ordersOpen.value = false
  oldLinksOpen.value = false
}

watch(user, (newVal) => {
  console.log('🟢 user changed in menuBar:', newVal);
}, { immediate: true });

watch(isDrawerOpen, (open) => {
  if (!open) {
    closeAllGroups();
  }
});

function toggleLanguage() {
  locale.value = locale.value === 'en' ? 'fi' : 'en';
}

function navigateTo(value) {
  closeAllGroups();
  router.push({ name: value });
}

const logout = async () => {
  try {
    console.log('Logging out...')
    await axios.get(`https://localhost:3030/api/v1/auth/logout`, { withCredentials: true })

    store.commit('LOGOUT') // Clear user from Vuex

    console.log('User logged out successfully')
    
    window.location.href = BASE_URL
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

</script>

<template>
  <v-navigation-drawer
    v-model="isDrawerOpen"
    app
    rail
    width="256"
    rail-width="72"
    expand-on-hover 
  >
    <v-list v-if="isDrawerOpen">
      <v-list-item
        v-if="user"
        :prepend-avatar="user.user.avatar"
        :subtitle="user.user.email"
        :title="user.user.name"
      ></v-list-item>
      <v-divider></v-divider>
    </v-list>
    
    <v-list density="compact" nav>

      <!-- Dashboard Group -->
      <v-list-group
        v-model="dashboardOpen"
        prepend-icon="mdi-view-dashboard"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Dashboard" />
        </template>

        <v-list-item
          prepend-icon="mdi-laptop"
          :title="t('buttons.dashboard')"  
          :active="route.name === 'home'"
          @click="navigateTo('home')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-laptop"
          :title="t('buttons.dashboard2')"  
          :active="route.name === 'dash2'"
          @click="navigateTo('dash2')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-plus"
          :title="t('buttons.orderDashboard')"  
          :active="route.name === 'orderDashboard'"
          @click="navigateTo('orderDashboard')"
        ></v-list-item>
      </v-list-group>
      <!-- Agents Group -->
      <v-list-group
        v-model="agentsOpen"
        prepend-icon="mdi-account-group"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Agents" />
        </template>

        <v-list-item
          prepend-icon="mdi-account-multiple"
          :title="t('buttons.agents')"  
          :active="route.name === 'agents'"
          @click="navigateTo('agents')"
        ></v-list-item>  

      </v-list-group>

      <!-- Forms Group -->
      <v-list-group
        v-model="formsOpen"
        prepend-icon="mdi-form-textbox"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Forms" />
        </template>

        <v-list-item
          title="Add Agents"
          to="/agents/add"
        />
        <v-list-item
          title="Add Stats"
          to="/agents/stats"
        />
      </v-list-group>
      <!-- Orders -->
      <v-list-group
        v-model="ordersOpen"
        prepend-icon="mdi-clipboard-text-outline "
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Orders" />
        </template>
        <v-list-item
          prepend-icon="mdi-folder-plus"
          :title="t('buttons.addCaseForm')"  
          :active="route.name === 'addCaseForm'"
          @click="navigateTo('addCaseForm')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-folder-plus"
          :title="t('buttons.addOrderForm')"  
          :active="route.name === 'addOrderForm'"
          @click="navigateTo('addOrderForm')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-plus"
          :title="t('buttons.addGcAgent')"  
          :active="route.name === 'addGcAgent'"
          @click="navigateTo('addGcAgent')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-minus"
          :title="t('buttons.addDailyLog')"  
          :active="route.name === 'addDailyLog'"
          @click="navigateTo('addDailyLog')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-plus"
          :title="t('buttons.orderProgress')"  
          :active="route.name === 'orderProgress'"
          @click="navigateTo('OrderProgressTable')"
        ></v-list-item>
      </v-list-group>
      <!-- Old links Group -->
      <v-list-group
        v-model="oldLinksOpen"
        prepend-icon="mdi-form-textbox"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Old links" />
        </template>
        <v-list-item
          prepend-icon="mdi-folder-plus"
          :title="t('buttons.addCase')"  
          :active="route.name === 'addCase'"
          @click="navigateTo('addCase')"
        ></v-list-item>   
        <v-list-item
          prepend-icon="mdi-account-plus"
          :title="t('buttons.addAgent')"  
          :active="route.name === 'addAgent'"
          @click="navigateTo('addAgent')"
        ></v-list-item>  
        <v-list-item
          prepend-icon="mdi-account-plus"
          :title="t('buttons.addAgentStats')"  
          :active="route.name === 'addAgentStats'"
          @click="navigateTo('addAgentStats')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-plus"
          :title="t('buttons.addAgentGoals')"  
          :active="route.name === 'addAgentGoals'"
          @click="navigateTo('addAgentGoals')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-plus"
          :title="t('buttons.addAgentCaseInfo')"  
          :active="route.name === 'addAgentCaseInfo'"
          @click="navigateTo('addAgentCaseInfo')"
        ></v-list-item>
      </v-list-group>
      <v-divider></v-divider>
      <v-list-item
        prepend-icon="mdi-earth"
        :title="t('buttons.language')"
        @click="toggleLanguage"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-logout"
        :title="t('buttons.logout')"  
        @click="logout"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
