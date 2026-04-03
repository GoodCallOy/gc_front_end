<!-- src/components/PostLogin.vue -->
<template>
  <div class="post-login-wrapper">
    <div class="post-login-card">
      <div class="title">Signing you in as…</div>

      <v-list v-if="userFromStore">
        <v-list-item :prepend-avatar="userFromStore.avatar">
          <v-list-item-title>{{ userFromStore.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ userFromStore.email }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item class="d-flex justify-center" style="background-color: cadetblue;">
          <v-list-item-title class="text-capitalize font-weight-bold align-center">
            {{ userFromStore.role }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import urls from '@/js/config.js'
import { resolveLinkedGcAgent } from '@/js/resolveLinkedGcAgent.js'

const store = useStore()
const router = useRouter()

const statusMessage = ref('Contacting the server…')
const userJson = ref('')
const REDIRECT_DELAY_MS = 5000

// What the template will read
const userFromStore = computed(() => store.state.user?.user || null)

async function fetchAllData() {
  await store.dispatch('fetchOrders')
  // Always refetch after login so session matches DB (see CACHE_TIMEOUT on gcAgents)
  await store.dispatch('fetchgcAgents', true)
  await store.dispatch('fetchDailyLogs')
  await store.dispatch('fetchUsers')
}

function getHomeRouteNameForRole(role) {
  if (role === 'admin' || role === 'manager') return 'orderDashboard'
  if (role === 'caller') return 'agentDashboard'
  return 'login'
}
const delay = ms => new Promise(res => setTimeout(res, ms))

onMounted(async () => {
  try {
    const { data } = await axios.get(`${urls.backEndURL}/auth/me`, { withCredentials: true })
    
    const currentUser = data.user ?? data

    userJson.value = JSON.stringify(currentUser, null, 2)

    // Persist for guard fallbacks and page reloads
    localStorage.setItem('auth_user', JSON.stringify(currentUser))

    store.commit('SET_USER', { user: currentUser })

    await fetchAllData()

    const gcAgents = store.getters['gcAgents'] || []
    const linkedAgent = resolveLinkedGcAgent(currentUser, gcAgents)

    if (linkedAgent) {
      console.log('[auth] Linked GC agent from backend (GET /gcAgents):', {
        _id: linkedAgent._id,
        name: linkedAgent.name,
        email: linkedAgent.email,
        role: linkedAgent.role,
        linkedUserId: linkedAgent.linkedUserId,
        active: linkedAgent.active,
      })
    } else {
      console.log(
        '[auth] No GC agent row linked to this user after fetch (user _id:',
        currentUser._id ?? currentUser.id,
        ')'
      )
    }

    // /auth/me + cached gcAgents can diverge when both edit paths write the same backend fields.
    // For non-admin sessions, prefer the gcAgent row we just loaded for role/name/email shown in the app.
    let sessionUser = currentUser
    if (linkedAgent && currentUser.role !== 'admin') {
      sessionUser = {
        ...currentUser,
        role: linkedAgent.role ?? currentUser.role,
        name: linkedAgent.name ?? currentUser.name,
        email: linkedAgent.email ?? currentUser.email,
      }
      if (!sessionUser.linkedUserId && linkedAgent._id) {
        sessionUser.linkedUserId = linkedAgent._id
      }
      localStorage.setItem('auth_user', JSON.stringify(sessionUser))
      store.commit('SET_USER', { user: sessionUser })
    }

    const dailyLogs = computed(() => store.getters['dailyLogs'])
    console.log('dailyLogs', dailyLogs.value)

    const dest = getHomeRouteNameForRole(sessionUser.role)
    statusMessage.value = `Loaded user. Redirecting to ${dest}…`

    if (REDIRECT_DELAY_MS > 0) await delay(REDIRECT_DELAY_MS)

    router.replace({ name: dest })
  } catch (error) {
    statusMessage.value = 'Authentication failed. Sending you to login…'
    router.replace({ name: 'login' })
  }
})
</script>

<style scoped>
  .post-login-wrapper { min-height: 60vh; display: grid; place-items: center; }
  .post-login-card { text-align: center; padding: 1.25rem 1.5rem; border-radius: 12px; border: 1px solid rgba(0,0,0,.08); background: #fff; box-shadow: 0 4px 18px rgba(0,0,0,.06); }
  .title { font-size: 1.1rem; font-weight: 600; margin-bottom: .5rem; }
  .subtitle { color: #666; font-size: .95rem; }
  .data { text-align: left; background: #f6f8fa; padding: .75rem; border-radius: 8px; margin: .5rem 0 0; max-width: 520px; max-height: 240px; overflow: auto; }
</style>
