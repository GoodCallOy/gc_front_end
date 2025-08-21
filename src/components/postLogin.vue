<!-- src/components/PostLogin.vue -->
<template>
  <div class="post-login-wrapper">
    <div class="post-login-card">
      <div class="title">Signing you in…</div>
      <pre v-if="userJson" class="data">{{ userJson }}</pre>
      <div class="subtitle">{{ statusMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import urls from '@/js/config.js'
import { useStore } from 'vuex'
const store = useStore()
const router = useRouter()
const statusMessage = ref('Contacting the server…')
const userJson = ref('')
const destinationRouteName = ref(null)

const REDIRECT_DELAY_MS = 5000 // <- change this to taste (ms). Set 0 to disable delay.

function getHomeRouteNameForRole(role) {
    console.log(`Determining home route for role: ${role}`)
  if (role === 'admin' || role === 'manager') return 'home'
  if (role === 'caller') return 'agentDashboard'
  return 'login'
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

onMounted(async () => {
  try {
    const { data: user } = await axios.get(`${urls.backEndURL}/auth/me`, { withCredentials: true })
    
    const currentUser = user.user
    userJson.value = JSON.stringify(currentUser, null, 2)
    console.log('Current user:', currentUser)

    localStorage.setItem('auth_user', JSON.stringify(currentUser));  
    store.commit('SET_USER', { user: currentUser }); 


    destinationRouteName.value = getHomeRouteNameForRole(currentUser.role)
    statusMessage.value = `Loaded user. Redirecting to ${destinationRouteName.value}…`

    if (REDIRECT_DELAY_MS > 0) {
      await delay(REDIRECT_DELAY_MS)
    }
    
    console.log(`Redirecting to ${destinationRouteName.value}...`)
    

    router.replace({ name: currentUser.role === 'caller' ? 'agentDashboard' : 'home' });
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
