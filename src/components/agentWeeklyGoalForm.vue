<template>
  <v-container class="py-6" style="max-width: 640px;">
    <h1 class="text-h5 mb-4">{{ t('agentWeeklyGoal.title') }}</h1>

    <v-alert v-if="!assignedCasesList.length" type="info" variant="tonal" class="mb-4">
      {{ t('agentWeeklyGoal.noCasesAssigned') }}
    </v-alert>

    <v-form v-else ref="formRef" v-model="valid" @submit.prevent="submitForm">
      <!-- 1) Month -->
      <v-select
        v-model="form.selectedMonth"
        :items="monthOptions"
        item-title="title"
        item-value="value"
        :label="t('agentWeeklyGoal.selectMonth')"
        density="comfortable"
        class="mb-3"
        @update:model-value="onMonthChange"
      />

      <!-- 2) Week -->
      <v-select
        v-model="form.selectedWeekIndex"
        :items="weekOptions"
        item-title="title"
        item-value="value"
        :label="t('agentWeeklyGoal.selectWeek')"
        :rules="[v => v != null && v !== '' || t('agentWeeklyGoal.weekRequired')]"
        :loading="weeksLoading"
        density="comfortable"
        class="mb-4"
      />

      <!-- 3) List of cases (current month only): case name first, then goal input -->
      <div class="text-subtitle-2 mb-2">{{ t('agentWeeklyGoal.goalsPerCase') }}</div>
      <v-list class="mb-4 rounded border" density="comfortable">
        <v-list-item
          v-for="order in assignedCasesList"
          :key="order._id"
          class="align-center"
        >
          <v-list-item-title>{{ order.caseName || order.caseId || '—' }}</v-list-item-title>
          <template #append>
            <v-text-field
              v-model.number="goalByOrderId[order._id]"
              type="number"
              min="0"
              placeholder="0"
              density="compact"
              hide-details
              class="ml-3"
              style="max-width: 100px;"
            />
          </template>
        </v-list-item>
      </v-list>

      <div class="d-flex align-center mt-4">
        <v-btn
          type="submit"
          color="primary"
          :disabled="!canSubmit || submitting"
          :loading="submitting"
        >
          {{ t('agentWeeklyGoal.submit') }}
        </v-btn>
        <v-alert v-if="message" :type="alertType" density="compact" class="mb-0 ml-3">
          {{ message }}
        </v-alert>
      </div>
    </v-form>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import urls from '@/js/config.js';
import { getMonthKey, getMonthWeeks } from '@/js/dateUtils';

const { t } = useI18n();
const route = useRoute();
const store = useStore();

const formRef = ref(null);
const valid = ref(false);
const submitting = ref(false);
const message = ref('');
const alertType = ref('success');
const monthWeeks = ref([]);
const weeksLoading = ref(false);

const form = ref({
  selectedMonth: '',
  selectedWeekIndex: null,
});

// One goal per order: key = orderId, value = number (empty means no goal)
const goalByOrderId = reactive({});

// Build month dropdown: current month + next 3 months
const monthOptions = computed(() => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const value = `${year}-${String(month).padStart(2, '0')}`;
    const title = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    options.push({ title, value });
  }
  return options;
});

// Week dropdown from custom week configuration
const weekOptions = computed(() => {
  return monthWeeks.value.map((week, index) => {
    const startStr = week.start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const endStr = week.end.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return {
      title: `${week.weekNumber} (${startStr} – ${endStr})`,
      value: index,
    };
  });
});

async function loadWeeksForMonth(monthKey) {
  if (!monthKey) {
    monthWeeks.value = [];
    return;
  }
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  weeksLoading.value = true;
  try {
    monthWeeks.value = await getMonthWeeks(year, month);
  } catch (e) {
    console.warn('Failed to load week configuration:', e);
    monthWeeks.value = [];
  } finally {
    weeksLoading.value = false;
  }
}

function onMonthChange() {
  form.value.selectedWeekIndex = null;
  loadWeeksForMonth(form.value.selectedMonth);
}

// Current agent (linked gc agent for caller)
const selectedGcAgent = computed(() => {
  const user = store.state.user?.user ?? JSON.parse(localStorage.getItem('auth_user') || 'null');
  const linkId = user?.linkedUserId ?? null;
  if (!linkId) return null;
  const agents = store.getters['gcAgents'] || [];
  return agents.find(a => String(a._id ?? a.id) === String(linkId)) || null;
});

const orders = computed(() => store.getters['orders'] || []);

// Cases the agent is assigned to that overlap the selected month only
const assignedCasesList = computed(() => {
  const agent = selectedGcAgent.value;
  const monthKey = form.value.selectedMonth;
  if (!agent || !monthKey) return [];
  const agentId = String(agent._id ?? agent.id ?? '');
  const [y, m] = monthKey.split('-').map(Number);
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0, 23, 59, 59, 999);
  return orders.value.filter(order => {
    if (!(order.assignedCallers || []).some(x => String(x?._id ?? x?.id ?? x) === agentId)) return false;
    const orderStart = new Date(order.startDate || 0);
    const orderEnd = new Date(order.deadline || 0);
    return orderStart <= monthEnd && orderEnd >= monthStart;
  });
});

// Ensure goalByOrderId has a key for each assigned case (so v-model works)
watch(assignedCasesList, (list) => {
  list.forEach(order => {
    const id = order._id ?? order.id;
    if (id != null && !(id in goalByOrderId)) {
      goalByOrderId[id] = '';
    }
  });
}, { immediate: true });

// Can submit when week is selected and at least one goal is entered
const canSubmit = computed(() => {
  if (form.value.selectedWeekIndex == null || form.value.selectedWeekIndex === '') return false;
  return assignedCasesList.value.some(order => {
    const g = goalByOrderId[order._id ?? order.id];
    return g !== '' && g != null && Number(g) >= 0;
  });
});

function getSelectedWeekRange() {
  const idx = form.value.selectedWeekIndex;
  if (idx == null || idx === '' || !monthWeeks.value[idx]) return null;
  const week = monthWeeks.value[idx];
  const start = week.start.toISOString().split('T')[0];
  const end = week.end.toISOString().split('T')[0];
  return { start, end };
}

onMounted(async () => {
  await store.dispatch('fetchOrders');
  await store.dispatch('fetchgcAgents');
  const now = new Date();
  form.value.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  await loadWeeksForMonth(form.value.selectedMonth);
});

async function submitForm() {
  if (!canSubmit.value || submitting.value) return;
  const agent = selectedGcAgent.value;
  const weekRange = getSelectedWeekRange();
  if (!agent || !weekRange) {
    message.value = t('agentWeeklyGoal.weekRequired');
    alertType.value = 'error';
    return;
  }

  submitting.value = true;
  message.value = '';
  const monthKey = getMonthKey(weekRange.start);
  let successCount = 0;
  let lastError = null;

  for (const order of assignedCasesList.value) {
    const orderId = order._id ?? order.id;
    const raw = goalByOrderId[orderId];
    if (raw === '' || raw == null) continue;
    const goal = Number(raw);
    if (isNaN(goal) || goal < 0) continue;

    try {
      const payload = {
        agent: agent.name,
        agentId: agent._id ?? agent.id,
        case: order.caseName || order.caseId || '—',
        orderId,
        goal,
        type: 'Weekly',
        goal_date: { start: weekRange.start, end: weekRange.end },
        monthKey,
      };
      await axios.post(`${urls.backEndURL}/agentGoals/`, payload);
      successCount++;
    } catch (err) {
      console.error('Agent weekly goal submit error:', err);
      lastError = err;
    }
  }

  if (successCount > 0) {
    message.value = t('agentWeeklyGoal.successCount').replace('{n}', successCount);
    alertType.value = 'success';
    Object.keys(goalByOrderId).forEach(k => { goalByOrderId[k] = ''; });
    form.value.selectedWeekIndex = null;
    setTimeout(() => { message.value = ''; }, 3000);
  } else {
    message.value = lastError?.response?.data?.message || t('agentWeeklyGoal.errorSubmit');
    alertType.value = 'error';
  }
  submitting.value = false;
}
</script>
