<template>
  <v-card class="pa-4">
    <v-card-title>Order Progress</v-card-title>

    <v-data-table
      :headers="headers"
      :items="progressData"
      item-value="_id"
      class="elevation-1"
      :items-per-page="5"
    >
        <template v-slot:[`item.logs`]="{ item }"> 
        <div>
          <div v-for="log in item.logs" :key="log.date">
            <strong>{{ log.date }}:</strong> {{ log.quantity }}
          </div>
        </div>
      </template>

      <template v-slot:[`item.progressBar`]="{ item }"> 
        <v-progress-linear
          :model-value="(item.totalCompleted / totalQuantity) * 100"
          color="primary"
          height="16"
          rounded
        >
          <template #default>
            {{ item.totalCompleted }} / {{ totalQuantity }}
          </template>
        </v-progress-linear>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  orderId: {
    type: String,
    required: true
  }
})

const headers = [
  { title: 'Agent', key: 'agent.name' },
  { title: 'Logs', key: 'logs' },
  { title: 'Progress', key: 'progressBar' }
]

const progressData = ref([])
const totalQuantity = ref(0)

onMounted(async () => {
  try {
    const res = await axios.get(`/orders/${props.orderId}/progress`)
    progressData.value = res.data.assignedCallers
    totalQuantity.value = res.data.totalQuantity
  } catch (err) {
    console.error('Failed to load order progress:', err)
  }
})
</script>
