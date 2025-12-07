<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const isDrawerOpen = ref(true);
const isMobile = ref(false);

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

const BASE_URL =
      window.location.hostname === 'localhost'
        ? 'https://localhost:8080/login'
        : 'https://goodcall-front-end.onrender.com/login'

const store = useStore() // Access Vuex store
const user = computed(() => store.state.user)
const agents = computed(() => store.state.users)

// Check if caller is linked to an agent account
const isCallerLinkedToAgent = computed(() => {
  const currentUser = user.value?.user;
  if (currentUser?.role !== 'caller') return true; // Not a caller, so no restriction
  return !!currentUser?.linkedUserId; // Check if caller has linkedUserId
})
import urls from '@/js/config.js'

const opened = ref([])

const dashboardOpen = ref(false)
const agentsOpen = ref(false)
const formsOpen = ref(false)
const ordersOpen = ref(false)
const oldLinksOpen = ref(false)

console.log('agents from store in menuBar:', agents.value);

function closeAllGroups() {
  console.log('Closing all groups in menuBar')
  opened.value = []
}


watch(isDrawerOpen, (open) => {
  if (!open) {
    closeAllGroups();
  }
});

function updateIsMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.matchMedia('(max-width: 600px)').matches;
  }
}

updateIsMobile();
if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateIsMobile);
}

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

// Home route detection
const isHomeRoute = computed(() => {
  const homeRoutes = ['orderDashboard', 'agentDashboard', 'dashboard']
  return homeRoutes.includes(route.name)
})

// Get home route based on user role
function getHomeRouteForRole(role) {
  switch (role) {
    case 'admin':
    case 'manager':
      return 'orderDashboard'
    case 'caller':
      return 'agentDashboard'
    default:
      return 'dashboard'
  }
}

// Navigate to home
function navigateToHome() {
  const homeRoute = getHomeRouteForRole(currentUser.value?.role)
  navigateTo(homeRoute)
}

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
  <v-app-bar
    app
    color="primary"
    density="comfortable"
    elevation="2"
    class="d-sm-none"
  >
    <v-app-bar-nav-icon @click="isDrawerOpen = !isDrawerOpen" />
    <v-toolbar-title>Menu</v-toolbar-title>
  </v-app-bar>

  <v-navigation-drawer
    v-model="isDrawerOpen"
    app
    :temporary="isMobile"
    :scrim="isMobile"
    :rail="!isMobile"
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
    
    <v-list v-model:opened="opened" :density="isMobile ? 'comfortable' : 'compact'" nav>
      
      <!-- Home Button -->
      <v-list-item
        prepend-icon="mdi-home"
        :title="t('buttons.home')"
        :active="isHomeRoute"
        @click="navigateToHome"
        class="mb-2"
      />
      
      <v-divider class="mb-2" />

      <!-- Dashboard Group -->
      <v-list-group
        v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'" 
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
          v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'"
          prepend-icon="mdi-table"
          title="Cases Progress"  
          :active="route.name === 'casesProgress'"
          @click="navigateTo('casesProgress')"
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
        <v-list-item
          prepend-icon="mdi-account-multiple"
          :title="t('buttons.editAgent')"  
          :active="route.name === 'agents'"
          @click="navigateTo('agents')"
        ></v-list-item>  
      </v-list-group>
      <!-- Orders -->
      <v-list-group
        v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager' || (user?.user?.role === 'caller' && isCallerLinkedToAgent)"
        v-model="ordersOpen"
        prepend-icon="mdi-clipboard-text-outline "
      >
        <template #activator="{ props }">
          <v-list-item 
            v-bind="props" 
            title="Orders"
          />
        </template>
        <v-list-item
          v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'" 
          prepend-icon="mdi-folder-plus"
          :title="t('buttons.addCaseForm')"  
          :active="route.name === 'addCaseForm'"
          @click="navigateTo('addCaseForm')" 
        ></v-list-item>
        <v-list-item
          v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'" 
          prepend-icon="mdi-folder-plus"
          :title="t('buttons.addOrderForm')"  
          :active="route.name === 'addOrderForm'"
          @click="navigateTo('addOrderForm')"
   
        ></v-list-item>
        <v-list-item
          v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'" 
          prepend-icon="mdi-format-list-bulleted"
          title="Case Types"
          :active="route.name === 'caseTypesManager'"
          @click="navigateTo('caseTypesManager')"
        ></v-list-item>
        <v-list-item
          v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'" 
          prepend-icon="mdi-file-excel"
          title="Import Excel"
          :active="route.name === 'excelImport'"
          @click="navigateTo('excelImport')"
        ></v-list-item>
        <v-list-item
          v-if="user?.user?.role === 'admin'"
          prepend-icon="mdi-account-plus"
          :title="t('buttons.addGcAgent')"  
          :active="route.name === 'addGcAgent'"
          @click="navigateTo('addGcAgent')"        
        ></v-list-item>
        <v-list-item
          v-if="user?.user?.role === 'admin'"
          prepend-icon="mdi-account-plus"
          :title="t('buttons.listGcAgents')"  
          :active="route.name === 'listGcAgents'"
          @click="navigateTo('listGcAgents')" 
        ></v-list-item>
        <v-list-item
          v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'"
          prepend-icon="mdi-calendar-week"
          title="Week Configuration"  
          :active="route.name === 'weekConfig'"
          @click="navigateTo('weekConfig')" 
        ></v-list-item>
        <v-list-item
          v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager' || (user?.user?.role === 'caller' && isCallerLinkedToAgent)"
          prepend-icon="mdi-account-plus"
          :title="t('buttons.addDailyLog')"  
          :active="route.name === 'addDailyLog'"
          @click="navigateTo('addDailyLog')"
        ></v-list-item>
        <v-list-item
          v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'"
          prepend-icon="mdi-account-plus"
          :title="t('buttons.orderProgress')"  
          :active="route.name === 'orderProgress'"
          @click="navigateTo('OrderProgressTable')"
        ></v-list-item>
      </v-list-group>
      <!-- Old links Group -->
      <v-list-group
       v-if="user?.user?.role === 'admin' || user?.user?.role === 'manager'"
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
