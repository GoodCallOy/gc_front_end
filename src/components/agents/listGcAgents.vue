<!-- src/components/AgentCards.vue -->
<template>
  <v-container class="py-6">
    <div class="text-h5 mb-4">Agents</div>

    <v-alert v-if="!agents.length" type="info" variant="tonal">
      No agents yet.
    </v-alert>

    <v-row v-else dense>
      <v-col
        v-for="agent in agents"
        :key="agent._id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="h-100 d-flex flex-column">
          <v-card-title class="text-truncate">
            {{ agent.name }}
          </v-card-title>
          <v-card-subtitle class="text-truncate">
            {{ agent.email }}
          </v-card-subtitle>

          <v-spacer />

          <v-card-actions>
            <v-chip size="small" class="mr-2" :color="agent.active ? 'success' : 'grey'">
              {{ agent.role }}
            </v-chip>

            <v-spacer />

            <v-btn
              size="small"
              color="primary"
              @click="goToEditAgent(agent)"
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
  const list = store.getters['gcAgents']
  if (!Array.isArray(list) || list.length === 0) {
    try {
      await store.dispatch('fetchgcAgents', true) // your existing action
    } catch (e) {
      console.error('Failed to fetch agents:', e)
    }
  }
})

const agents = computed(() => store.getters['gcAgents'] || [])

// Navigate to edit page (your router expects ?activeAgent=<id>)
function goToEditAgent(agent) {
  router.push({
    name: 'editGcAgent',
    query: { activeAgent: agent._id }
  })
}
</script>
