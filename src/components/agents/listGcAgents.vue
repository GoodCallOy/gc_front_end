<!-- src/components/AgentCards.vue -->
<template>
  <v-container class="py-6">
    <div class="text-h5 mb-4">Users</div>

    <v-alert v-if="!users.length" type="info" variant="tonal">
      No users yet.
    </v-alert>

    <v-row v-else dense>
      <v-col
        v-for="user in users"
        :key="user._id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="h-100 d-flex flex-column">
          <v-card-title class="text-truncate">
            {{ user.name }}
          </v-card-title>
          <v-card-subtitle class="text-truncate">
            {{ user.email }}
          </v-card-subtitle>

          <v-spacer />

          <v-card-actions>
            <v-chip size="small" class="mr-2" :color="user.active ? 'success' : 'grey'">
              {{ user.role }}
            </v-chip>
            <v-chip size="small" class="mr-2" :color="user.linkedUserId ? 'success' : 'grey'">
              {{ user.linkedUserId ? 'Linked' : 'Unlinked' }}
            </v-chip>

            <v-spacer />

            <v-btn
              size="small"
              color="primary"
              @click="goToEditAgent(user)"
            >
              Edit
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

// Load agents once if not already in the store
onMounted(async () => {
  const list = store.getters['users']
  if (!Array.isArray(list) || list.length === 0) {
    try {
      await store.dispatch('fetchUsers', true) // your existing action
    } catch (e) {
      console.error('Failed to fetch users:', e)
    }
  }
})

const users = computed(() => store.getters['users'] || [])

// Navigate to edit page (your router expects ?activeAgent=<id>)
function goToEditAgent(user) {
  router.push({
    name: 'editGcAgent',
    query: { selectedUser: user._id }
  })
}
</script>
