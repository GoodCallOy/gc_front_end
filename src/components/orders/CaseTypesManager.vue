<template>
  <v-container style="width: 90%;">
    <h1 class="text-h5 mb-4">Case Types</h1>
    <v-card class="pa-4 mb-4">
      <v-form @submit.prevent="addType">
        <v-text-field v-model="newLabel" label="New Case Type" clearable />
        <v-btn color="primary" :disabled="!newLabel" @click="addType">Add</v-btn>
      </v-form>
    </v-card>

    <v-card>
      <v-list>
        <v-list-item v-for="(label, idx) in list" :key="label + idx">
          <v-text-field v-model="edits[label]" :label="'Label'" :placeholder="label" hide-details class="mr-4" />
          <v-btn size="small" color="primary" class="mr-2" @click="saveEdit(label)">Save</v-btn>
          <v-btn size="small" color="error" @click="remove(label)">Remove</v-btn>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const newLabel = ref('')
const edits = ref({})

const list = computed(() => store.getters.caseTypes || [])

onMounted(async () => {
  try { await store.dispatch('fetchCaseTypes') } catch {}
  rebuildEdits()
})

function rebuildEdits() {
  const map = {}
  for (const l of list.value) map[l] = l
  edits.value = map
}

async function addType() {
  const label = (newLabel.value || '').trim()
  if (!label) return
  await store.dispatch('addCaseType', label)
  newLabel.value = ''
  rebuildEdits()
}

async function saveEdit(oldLabel) {
  const updated = (edits.value[oldLabel] || '').trim()
  if (!updated || updated === oldLabel) return
  await store.dispatch('updateCaseType', { oldLabel, newLabel: updated })
  rebuildEdits()
}

async function remove(label) {
  await store.dispatch('removeCaseType', label)
  rebuildEdits()
}
</script>

<style scoped>
.mr-2 { margin-right: 8px; }
.mr-4 { margin-right: 16px; }
</style>


