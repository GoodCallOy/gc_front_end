<script setup>
import { ref, computed, watch, nextTick } from 'vue';
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
import urls from '@/js/config.js'

const opened = ref([])

const dashboardOpen = ref(false)
const agentsOpen = ref(false)
const formsOpen = ref(false)
const ordersOpen = ref(false)
const oldLinksOpen = ref(false)

function closeAllGroups() {
  console.log('Closing all groups in menuBar')
   opened.value = []
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

const currentUser = computed(() => {
  const fromStore = store.state.user?.user || null
  if (fromStore) return fromStore

  // fallback if store isn't hydrated yet
  try {
    return JSON.parse(localStorage.getItem('auth_user') || 'null')
  } catch {
    return null
  }
})

function toggleLanguage() {
  locale.value = locale.value === 'en' ? 'fi' : 'en';
}

async function navigateTo(name) {
  await router.push({ name })
  await nextTick()
  closeAllGroups()
}

async function logout() {
  try {
    // if you use cookie sessions, you MUST send credentials
    console.log('Logging out user:', user.value)
    await axios.get(`${urls.backEndURL}/auth/logout`, { withCredentials: true })
  } catch (error) {
    // network issues? still clear local state below
    console.warn('Logout request failed:', error?.response?.status, error?.message)
  } finally {
    // clear ALL local auth state BEFORE routing
    localStorage.removeItem('auth_user')
    localStorage.removeItem('token')

    // clear Vuex (use your real mutation name)
    if (store._mutations?.clearUser) {
      store.commit('LOGOUT')
    } else {
      // fallback if you only have setUser
      store.commit('SET_USER', { user: null })
      localStorage.removeItem('auth_user')
    }

    // now go to login; guard won't bounce you because role is gone
    router.replace({ name: 'login' })
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
      <template v-if="currentUser">
        <v-list-item :prepend-avatar="currentUser.avatar">
          <v-list-item-title>{{ currentUser.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ currentUser.email }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item class="d-flex justify-center" style="background-color: cadetblue;">
          <v-list-item-title class="text-capitalize font-weight-bold align-center">
            {{ currentUser.role }}
          </v-list-item-title>
        </v-list-item>
      </template>
    </v-list>
    
    <v-list density="compact" nav  v-model:opened="opened">

      <!-- Dashboard Group -->
      <v-list-group
        v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'" 
        v-model="dashboardOpen"
        value="dashboard"
        prepend-icon="mdi-view-dashboard"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Dashboard" />
        </template>

        <v-list-item
          prepend-icon="mdi-laptop"
          :title="t('buttons.orderDashboard')"  
          :active="route.name === 'orderDashboard'"
          @click="navigateTo('orderDashboard')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-laptop"
          :title="t('buttons.dashboard')"  
          :active="route.name === 'home'"
          @click="navigateTo('home')"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-plus"
          :title="t('buttons.assignGoals')"  
          :active="route.name === 'assignGoals'"
          @click="navigateTo('assignGoals')"
        ></v-list-item>
         <v-list-item
          prepend-icon="mdi-account-multiple"
          :title="t('buttons.agents')"  
          :active="route.name === 'agents'"
          @click="navigateTo('agents')"
        ></v-list-item>  
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
          v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'"  
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-folder-plus"
          :title="t('buttons.addOrderForm')"  
          :active="route.name === 'addOrderForm'"
          @click="navigateTo('addOrderForm')"
          v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'" 
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-plus"
          :title="t('buttons.addGcAgent')"  
          :active="route.name === 'addGcAgent'"
          @click="navigateTo('addGcAgent')"
          v-if="user?.user?.role === 'admin'"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-plus"
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
        v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'"
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
