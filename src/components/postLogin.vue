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

const store = useStore()
const router = useRouter()

const statusMessage = ref('Contacting the server…')
const userJson = ref('')
const REDIRECT_DELAY_MS = 5000

// What the template will read
const userFromStore = computed(() => store.state.user?.user || null)

function getHomeRouteNameForRole(role) {
  if (role === 'admin' || role === 'manager') return 'home'
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

    // IMPORTANT: commit shape must match what your guard reads (state.user.user.role)
    // Make sure your mutation stores under module 'user' with a 'user' field.
    // Example mutation: state.user = payload.user
    store.commit('SET_USER', { user: currentUser })

    const dest = getHomeRouteNameForRole(currentUser.role)
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
