<template>
  <v-container fluid style="width: 90%;" class="assign-goals">
    <v-card elevation="1" class="mb-4">
        <div class="d-flex align-center justify-space-around responsive-toolbar">

            <v-btn color="primary" @click="openAddAgentModal">
                {{ t('assignGoals.buttons.addAgent') }}
            </v-btn>

            <v-btn color="primary" @click="openAddCaseModal">
                {{ t('assignGoals.buttons.addCustomer') }}
            </v-btn>

            <!-- Date Range Display (center) -->
            <div class="d-flex align-center">
                <v-btn icon flat class="pa-0 ma-0" @click="getPreviousMonth">
                <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
                <div class="text-h6 font-weight-medium mx-3">{{ getFormattedDateRange() }}</div>
                <v-btn icon flat @click="getNextMonth">
                <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
            </div>

            <v-btn color="primary" @click="openAddOrderModal">
                {{ t('assignGoals.buttons.addCampaign') }}
            </v-btn>

            <v-btn
                color="secondary"
                :disabled="!selectedOrder"
                @click="openEditOrderModal"
            >
                {{ t('assignGoals.buttons.editCampaign') }}
            </v-btn>

            <v-btn
                color="success"
                :disabled="bulkCopying || !filteredSortedOrders.length"
                :loading="bulkCopying"
                @click="bulkCopyOrdersToNextMonth"
            >
                {{ t('assignGoals.buttons.bulkCopyCampaigns') }}
            </v-btn>
        </div>
    </v-card>

    <v-row>
      <!-- Orders Table -->
      <v-col cols="12" md="7">
        <v-data-table
          v-if="orders && orders.length"
          :headers="orderHeaders"
          :items="filteredSortedOrders"
          item-value="_id"
          class="elevation-1 mobile-scroll"
          :items-per-page="20"
          density="comfortable"
          :item-class="({ item }) => {
            const id = item?.raw?._id ?? item?._id;
            return [
              id === selectedOrderId ? 'selected-row' : '',
              copiedToNextMonth[String(id)] ? 'copied-row' : ''
            ].filter(Boolean).join(' ');
          }"
          @click:row="selectOrder"
        >
          <template #item.copy="{ item }">
            <v-icon
              style="cursor: pointer;"
              color="grey"
              class="mr-2"
              @click.stop="copyOrder(item)"
            >
              mdi-content-copy
            </v-icon>
          </template>

          <template #item.caseName="{ item }">
            <span
              class="text-primary"
              style="cursor: pointer; text-decoration: underline;"
              @click.stop="editCaseFromOrder(item)"
            >
              {{ item.caseName }}
            </span>
          </template>

          <template #item.goalsDistributed="{ item }">
            {{ getDistributedGoals(item) }}
          </template>

          <template #item.edit="{ item }">
            <v-icon
              style="cursor: pointer;"
              color="grey"
              class="mr-2"
              @click.stop="selectOrderForEdit(item)"
            >
              mdi-pencil
            </v-icon>
          </template>

          <template #item.actions="{ item }">
            <v-icon
              style="cursor: pointer;"
              color="grey"
              class="mr-2"
              @click.stop="deleteOrder(item._id)"
            >
              mdi-delete
            </v-icon>
          </template>
        </v-data-table>

      </v-col>

      <!-- Agent Assignment -->
     <!-- Agent Assignment -->
<v-col cols="12" md="5" class="pa-4">
  <h3 class="text-h6 mb-2">
    {{ t('assignGoals.assignGoalsFor') }} ({{ selectedOrder && selectedOrder.caseName || t('assignGoals.noOrderSelected') }})
  </h3>

  <div v-if="rightPanelLoading" class="d-flex align-center justify-center pa-8">
    <v-progress-circular indeterminate color="primary" size="48" />
  </div>

  <v-col v-else-if="selectedOrder?.agentSummary?.length" cols="12" class="pa-0">
    <v-row>
      <v-col
        v-for="agent in selectedOrder.agentSummary"
        :key="agent.id"
        cols="12"
        class="mb-3"
      >
        <v-card outlined>
          <v-row no-gutters>
            <!-- Left: name + input -->
            <v-col cols="12" md="5" class="pa-4">
              <div class="text-subtitle-1 font-weight-medium mb-2">
                {{ agent.name }}
              </div>
              <v-text-field
                v-model.number="agent.goalForThisOrder"
                type="number"
                dense
                hide-details
                :label="t('assignGoals.formLabels.goal')"
                style="max-width: 100px;"
              />
              <v-text-field
                v-model.number="agent.rateForThisOrder"
                type="number"
                dense
                hide-details
                :label="t('assignGoals.formLabels.rate')"
                style="max-width: 120px;"
              />
            </v-col>

            <!-- Right: monthly/other orders -->
            <v-col cols="12" md="7" class="pa-4">
              <div class="text-caption mb-1 text-grey">{{ t('assignGoals.thisMonth') }}</div>
              <div class="mb-2">
                {{ agent.goalForThisOrder }} {{ t('assignGoals.totalGoals') }}
              </div>

              <div class="text-caption mb-1 text-grey">{{ t('assignGoals.otherOrders') }}</div>
              <ul class="pl-3">
                <li
                  v-for="o in agent.AgentOrders"
                  :key="o.orderId || o._oid || o.name"
                >
                  {{ o.caseName || o.name }} – {{ o.goal }}
                  <span v-if="o.pricePerUnit">
                    ({{ (o.goal * o.pricePerUnit).toLocaleString(undefined, { style: 'currency', currency: 'EUR' }) }})
                  </span>
                </li>
              </ul>

              <div class="mt-2 font-bold">
                {{ t('assignGoals.totalRevenueAcrossAllOrders') }}
                {{ agent.monthRevenueFormatted || currency(agent.monthRevenue || 0) }}
              </div>
            </v-col>
            <v-btn
  color="primary"
  class="mt-4"
  :disabled="!hasGoalChanges || savingGoals"
  :loading="savingGoals"
  @click="submitGoals"
>
  {{ t('assignGoals.buttons.saveGoals') }}
</v-btn>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-col>

  <div v-else-if="!rightPanelLoading" class="text-grey pa-4">{{ t('assignGoals.noAgentsAssigned') }}</div>
</v-col>
    </v-row>
  </v-container>

  <!-- Modals -->
    <v-dialog v-model="showAddOrderModal" max-width="600">
    <v-card>
        <v-card-title>
            {{ isEditMode ? t('assignGoals.modals.editOrder') : t('assignGoals.modals.addNewOrder') }}
        </v-card-title>
        <v-card-text>
        <!-- Your add order form goes here -->

        <div class="d-flex flex-column align-center" style="justify-content: center; overflow-y: auto;">
        <v-form ref="formRef" style="width: 60%;" @submit.prevent="submitOredrForm">
        <v-autocomplete
            v-model="form.caseId"
            :items="caseOptions"
            item-value="value"
            item-title="title"
            :label="t('assignGoals.formLabels.selectCase')"
            clearable
        />

        <v-select
            v-model="form.caseUnit"
            :items="caseUnits"
            :label="t('assignGoals.formLabels.caseUnit')"
            :rules="[v => !!v || t('assignGoals.validation.caseUnitRequired')]"
            required
        />

        <v-text-field
            v-model.number="form.pricePerUnit"
            :label="t('assignGoals.formLabels.pricePerUnit')"
            type="number"
            :rules="[v => !!v || t('assignGoals.validation.pricePerUnitRequired')]"
            required
        />
        <v-text-field
            v-model.number="form.totalQuantity"
            :label="t('assignGoals.formLabels.totalQuantity')"
            type="number"
            :rules="[v => !!v || t('assignGoals.validation.quantityRequired')]"
            required
        />

        <v-text-field
            v-model="form.startDate"
            :label="t('assignGoals.formLabels.startDate')"
            type="date"
            :rules="[v => !!v || t('assignGoals.validation.startDateRequired')]"
            required
        />

        <v-text-field
            v-model="form.deadline"
            :label="t('assignGoals.formLabels.deadline')"
            type="date"
            :rules="[v => !!v || t('assignGoals.validation.deadlineRequired')]"
            required
        />

        <v-select
            v-model="form.orderStatus"
            :items="orderStatuses"
            :label="t('assignGoals.formLabels.orderStatus')"
            :rules="[v => !!v || t('assignGoals.validation.orderStatusRequired')]"
            required
        />

        <v-select
            v-model="form.caseType"
            :items="caseTypes"
            :label="t('assignGoals.formLabels.caseType')"
            :rules="[v => !!v || t('assignGoals.validation.caseTypeRequired')]"
            required
        />

        <v-text-field
            :model-value="estimatedRevenue"
            :label="t('assignGoals.formLabels.estimatedRevenue')"
            type="number"
            :rules="[v => !!v || t('assignGoals.validation.estimatedRevenueRequired')]"
            required
        />

        <v-select
            v-model="form.managers"
            :items="agentOptions"
            item-value="value"
            item-title="title"
            :label="t('assignGoals.formLabels.selectManagers')"
            multiple
            chips
            closable-chips
            clearable
        />

        <v-select
            v-model="form.assignedCallers"
            :items="agentOptions"
            item-value="value"
            item-title="title"
            :label="t('assignGoals.formLabels.assignCallers')"
            multiple
            chips
            closable-chips
            clearable
        />

        <v-text-field
            v-model.number="form.ProjectStartFee"
            :label="t('assignGoals.formLabels.projectStartFee')"
            type="number"
        />

        <v-text-field
            v-model.number="form.ProjectManagmentFee"
            :label="t('assignGoals.formLabels.projectManagementFee')"
            type="number"
        />
        <div v-if="form.assignedCallers.length" class="mt-4">
          <v-list>
            <v-list-item
              v-for="agentId in form.assignedCallers"
              :key="agentId"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ agentName(agentId) }}
                </v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                v-model.number="agentGoals[agentId]"
                :label="t('assignGoals.formLabels.goal')"
                type="number"
                min="0"
                style="max-width: 100px"
                />
              <v-text-field
                v-model.number="agentRates[agentId]"
                :label="t('assignGoals.formLabels.rate')"
                type="number"
                min="0"
                style="max-width: 120px"
              />
            </v-list-item-action>
            </v-list-item>
          </v-list>
        </div>

        <v-btn type="submit" color="primary" class="mt-4" :disabled="!addOrderFormValid">
          {{ isEditMode ? t('assignGoals.buttons.saveChanges') : t('assignGoals.buttons.createOrder') }}
        </v-btn>

        </v-form>


    </div>

        </v-card-text>
        <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeAddOrderModal">{{ t('assignGoals.buttons.close') }}</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>

    <v-dialog v-model="showAddAgentModal" max-width="600">
    <v-card>
        <v-card-title>{{ t('assignGoals.modals.addAgent') }}</v-card-title>
        <v-card-text>
        <div class="d-flex flex-column align-center" style="justify-content: center;">
            <v-form ref="agentForm" style="width: 60%;" @submit.prevent="submitAgentForm">
                <v-text-field
                    v-model="agent.name"
                    :label="t('assignGoals.formLabels.name')"
                    :rules="[v => !!v || t('assignGoals.validation.nameRequired')]"
                    required
                />

                <v-text-field
                    v-model="agent.email"
                    :label="t('assignGoals.formLabels.email')"
                    :rules="[v => !!v || t('assignGoals.validation.emailRequired'), v => /.+@.+\..+/.test(v) || t('assignGoals.validation.emailInvalid')]"
                    required
                />

                <v-select
                    v-model="agent.role"
                    :items="roles"
                    :label="t('assignGoals.formLabels.role')"
                    :rules="[v => !!v || t('assignGoals.validation.roleRequired')]"
                    required
                />

                <v-switch
                    v-model="agent.active"
                    :label="t('assignGoals.formLabels.active')"
                />

                <v-btn type="submit" color="primary">{{ t('assignGoals.buttons.addAgent') }}</v-btn>
                <v-alert
                    v-if="message"
                    :type="alertType"
                    class="ml-3"
                    dense
                    dismissible>
                    {{ message }}
                    </v-alert>
            </v-form>
        </div>
        </v-card-text>
        <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeAddAgentModal">{{ t('assignGoals.buttons.close') }}</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>

    <v-dialog v-model="showAddCaseModal" max-width="600">
    <v-card>
        <v-card-title>{{ t('assignGoals.modals.addCase') }}</v-card-title>
        <v-card-text>
        <!-- Your edit case form goes here -->
        <div class="d-flex flex-column align-center">
            <v-form ref="caseForm" style="width: 60%;" @submit.prevent="submitCaseForm">
                <v-text-field
                    v-model="gcCase.name"
                    :label="t('assignGoals.formLabels.caseName')"
                    :rules="[v => !!v || t('assignGoals.validation.nameRequired')]"
                    required
                />

                <v-text-field
                    v-model="gcCase.contactInfo.contactName"
                    :label="t('assignGoals.formLabels.contactName')"
                />

                <v-text-field
                    v-model="gcCase.contactInfo.contactTitle"
                    :label="t('assignGoals.formLabels.contactTitle')"
                />

                <v-text-field
                    v-model="gcCase.contactInfo.email"
                    :label="t('assignGoals.formLabels.email')"
                    :rules="[v => !v || /.+@.+\..+/.test(v) || t('assignGoals.validation.emailInvalid')]"
                />

                <v-btn type="submit" color="primary">{{ t('assignGoals.buttons.addCase') }}</v-btn>
            </v-form>
        </div>
        </v-card-text>
        <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeAddCaseModal">{{ t('assignGoals.buttons.close') }}</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>
</template>




<script setup>
import { ref, onMounted, computed, reactive, watch, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth } from '@/js/dateUtils';
import axios from 'axios'
import urls from '@/js/config.js'

const store = useStore()
const router = useRouter()
const { t } = useI18n()
const formRef = ref(null)
const agentGoals = reactive({});
const agentRates = reactive({});
const agentForm = ref(null);
const caseForm = ref(null);
const selectedOrder = ref(null)
const selectedOrderId = ref(null)
const rightPanelLoading = ref(false)
const isEditMode = ref(false);

const showEditOrderModal = ref(false);
const showAddCaseModal = ref(false);
const showAddAgentModal = ref(false);
const showAddOrderModal = ref(false);

const copiedToNextMonth = reactive({});
const pendingCopySourceId = ref(null);
const bulkCopying = ref(false);

function formatLocalDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helper to extract YYYY-MM-DD from any date format (handles timezone issues)
function toDateOnly(dateValue) {
  if (!dateValue) return null;
  const str = String(dateValue);
  // If it's already YYYY-MM-DD format, use it directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // If it's an ISO string, extract just the date part (before T)
  if (str.includes('T')) return str.split('T')[0];
  // Otherwise try to parse and format
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function saveCopiedFlags() {
  try {
    localStorage.setItem('gc_copied_to_next_month', JSON.stringify(copiedToNextMonth));
  } catch {}
}

function loadCopiedFlags() {
  try {
    const raw = localStorage.getItem('gc_copied_to_next_month');
    if (!raw) return;
    const obj = JSON.parse(raw) || {};
    Object.keys(obj).forEach(k => copiedToNextMonth[k] = !!obj[k]);
  } catch {}
}

function resetCopiedFlags() {
  Object.keys(copiedToNextMonth).forEach(k => delete copiedToNextMonth[k]);
}

function recomputeCopiedFlags() {
  resetCopiedFlags();
  const all = orders.value || [];
  const range = currentDateRange.value || [];
  const start = range[0];
  if (!all.length || !start) {
    saveCopiedFlags();
    return;
  }

  // Bounds for current month and next month
  const { from: currFrom, to: currTo } = monthBoundsFrom(start);
  const nextFrom = new Date(currFrom.getFullYear(), currFrom.getMonth() + 1, 1, 0, 0, 0, 0);
  const nextTo   = new Date(currFrom.getFullYear(), currFrom.getMonth() + 2, 0, 23, 59, 59, 999);

  // Index next-month orders by identity key
  const keyOf = (o) => `${String(o.caseId || '')}|${String(o.caseUnit || '')}|${Number(o.pricePerUnit || 0)}`;
  const nextKeys = new Set(
    all
      .filter(o => overlapsMonth(o, nextFrom, nextTo))
      .map(o => keyOf(o))
  );

  // For each current-month order, flag if equivalent exists in next month
  all
    .filter(o => overlapsMonth(o, currFrom, currTo))
    .forEach(o => {
      if (nextKeys.has(keyOf(o))) {
        copiedToNextMonth[String(o._id)] = true;
      }
    });

  saveCopiedFlags();
}

function isNextMonthOf(a, b) {
  // returns true if date b is in the calendar month immediately after a
  // Use string parsing to avoid timezone issues
  const strA = toDateOnly(a);
  const strB = toDateOnly(b);
  if (!strA || !strB) return false;
  
  const [ya, ma] = strA.split('-').map(Number); // year, month (1-12)
  const [yb, mb] = strB.split('-').map(Number);
  
  // Check if b is in the month immediately after a
  return (yb === ya && mb === ma + 1) || (yb === ya + 1 && ma === 12 && mb === 1);
}

function deriveCopiedFlagsFromOrders(allOrders) {
  if (!Array.isArray(allOrders) || !allOrders.length) return;
  // Build quick index by caseId for faster matching
  const byCase = new Map();
  for (const o of allOrders) {
    const key = String(o.caseId || '');
    if (!byCase.has(key)) byCase.set(key, []);
    byCase.get(key).push(o);
  }

  for (const o of allOrders) {
    const caseKey = String(o.caseId || '');
    const candidates = byCase.get(caseKey) || [];
    const hasNext = candidates.some(p => (
      p._id !== o._id &&
      isNextMonthOf(o.startDate, p.startDate) &&
      String(p.caseUnit || '') === String(o.caseUnit || '') &&
      Number(p.pricePerUnit || 0) === Number(o.pricePerUnit || 0)
    ));
    if (hasNext) {
      copiedToNextMonth[String(o._id)] = true;
    }
  }
  saveCopiedFlags();
}

function getNextMonthDateRange(currentRangeStart) {
  // Parse the date string (YYYY-MM-DD) directly to avoid timezone issues
  const dateStr = String(currentRangeStart).split('T')[0]; // Handle ISO strings too
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-12 format from the string
  
  // Calculate next month
  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear = year + 1;
  }
  
  // Get last day of next month
  const lastDay = new Date(nextYear, nextMonth, 0).getDate();
  
  const nextStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  const nextEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  return [nextStart, nextEnd];
}

// Alias for backward compatibility with single order copy
function monthDateRangeForNextMonthFrom(dateLike) {
  return getNextMonthDateRange(dateLike);
}

async function bulkCopyOrdersToNextMonth() {
  // Prevent double-execution
  if (bulkCopying.value) {
    console.warn('📋 Bulk copy: Already in progress, ignoring duplicate call');
    return;
  }
  
  if (!filteredSortedOrders.value || !filteredSortedOrders.value.length) {
    console.warn('📋 Bulk copy: No orders to copy');
    return;
  }
  
  try {
    bulkCopying.value = true;
    
    // Take a snapshot of source orders to prevent reactivity issues
    const sourceOrders = [...filteredSortedOrders.value];
    console.log(`📋 Bulk copy: Starting copy of ${sourceOrders.length} orders`);

    // Use the currentDateRange (the displayed month) to calculate next month
    // This avoids timezone parsing issues with individual order dates
    const currentStart = currentDateRange.value?.[0];
    if (!currentStart) {
      console.error('📋 Bulk copy: No current date range set');
      return;
    }
    
    const [nextStart, nextEnd] = getNextMonthDateRange(currentStart);
    console.log(`📋 Bulk copy: Current month starts: ${currentStart}`);
    console.log(`📋 Bulk copy: Target month range: ${nextStart} to ${nextEnd}`);

    let skippedCount = 0;
    let copiedCount = 0;
    let failedCount = 0;
    
    // Track what we create during this run to prevent duplicates within the batch
    const createdKeys = new Set();
    
    // Helper to create a unique key for duplicate detection
    const orderKey = (caseId, caseUnit, pricePerUnit) => 
      `${String(caseId || '')}|${String(caseUnit || '')}|${Number(pricePerUnit || 0)}`;

    for (const o of sourceOrders) {
      const key = orderKey(o.caseId, o.caseUnit, o.pricePerUnit);
      
      // Skip if we already created this in the current batch
      if (createdKeys.has(key)) {
        console.log(`📋 Bulk copy: Skipping "${o.caseName}" (already created in this batch)`);
        skippedCount++;
        continue;
      }
      
      // Skip if an equivalent order already exists in next month (from previous copies)
      const duplicateExists = (orders.value || []).some(p => (
        String(p.caseId || '') === String(o.caseId || '') &&
        isNextMonthOf(o.startDate, p.startDate) &&
        String(p.caseUnit || '') === String(o.caseUnit || '') &&
        Number(p.pricePerUnit || 0) === Number(o.pricePerUnit || 0)
      ));
      
      if (duplicateExists) {
        console.log(`📋 Bulk copy: Skipping "${o.caseName}" (already exists in next month)`);
        copiedToNextMonth[String(o._id)] = true;
        skippedCount++;
        continue;
      }

      const assignedIds = [...new Set(
        (o.assignedCallers || []).map(x => String(x?._id ?? x?.id ?? x))
      )];

      const payload = {
        caseId: o.caseId || null,
        caseUnit: o.caseUnit || null,
        pricePerUnit: Number(o.pricePerUnit) || 0,
        totalQuantity: Number(o.totalQuantity) || 0,
        startDate: nextStart,
        deadline: nextEnd,
        orderStatus: o.orderStatus || 'pending',
        caseType: o.caseType || null,
        ProjectStartFee: Number(o.ProjectStartFee || 0),
        ProjectManagmentFee: Number(o.ProjectManagmentFee || 0),
        managers: o.managers || [],
        assignedCallers: assignedIds,
        agentGoals: { ...(o.agentGoals || {}) },
        caseName: o.caseName || '',
        estimatedRevenue: (Number(o.pricePerUnit) || 0) * (Number(o.totalQuantity) || 0),
      };

      try {
        console.log(`📋 Bulk copy: Copying "${o.caseName}" with dates ${nextStart} to ${nextEnd}...`);
        await axios.post(`${urls.backEndURL}/orders/`, payload);
        copiedToNextMonth[String(o._id)] = true;
        createdKeys.add(key); // Track that we created this
        copiedCount++;
        console.log(`✅ Bulk copy: Successfully copied "${o.caseName}"`);
      } catch (err) {
        failedCount++;
        console.error('❌ Bulk copy failed for order', o._id, o.caseName, err?.response?.data || err?.message);
      }
    }

    console.log(`📋 Bulk copy complete: ${copiedCount} copied, ${skippedCount} skipped (duplicates), ${failedCount} failed`);

    saveCopiedFlags();
    await fetchAllData();
    recomputeCopiedFlags();
  } finally {
    bulkCopying.value = false;
  }
}


async function fetchAllData() {
  // Selective fetching - only fetch data needed for assign goals
  await store.dispatch('fetchForContext', 'assignGoals');
}


const orders = computed(() => store.getters['orders'])
const gcAgents = computed(() => store.getters['gcAgents'])
const agents = gcAgents
const currentDateRange = computed(() => store.getters['currentDateRange'])
const cases = computed(() => store.getters['GcCases'])
const roles = ['admin', 'caller', 'manager']
const message = ref('')
const alertType = ref('success') // 'success' or 'error'
const savingGoals = ref(false)
const caseTypes = computed(() => {
  const list = store.getters.caseTypes || []
  // debug
  try { console.log('assignGoals caseTypes computed:', list) } catch {}
  return list
})

const orderHeaders = computed(() => [
  { title: t('assignGoals.tableHeaders.caseName'), key: 'caseName' },
  { title: t('assignGoals.tableHeaders.totalGoals'), key: 'totalQuantity' },
  { title: t('assignGoals.tableHeaders.goalsDistributed'), key: 'goalsDistributed', sortable: false },
  { title: t('assignGoals.tableHeaders.priceUnit'), key: 'caseUnit' },
  { title: t('assignGoals.tableHeaders.copy'), key: 'copy', sortable: false },
  { title: t('assignGoals.tableHeaders.edit'), key: 'edit', sortable: false },
  { title: t('assignGoals.tableHeaders.delete'), key: 'actions', sortable: false }
])

const agent = ref({
  name: '',
  email: '',
  role: '',
  active: true
})

const gcCase = ref({
  name: '',
  contactInfo: {
    contactName: '',
    contactTitle: '',
    email: ''
  }
})

const defaultForm = () => ({
  caseId: null,
  caseUnit: null,
  pricePerUnit: 0,
  totalQuantity: 0,
  startDate: '',
  deadline: '',
  orderStatus: null,
  caseType: null,
  ProjectStartFee: 0,
  ProjectManagmentFee: 0,
  managers: [],
  assignedCallers: []
})

const form = ref(defaultForm())

const estimatedRevenue = computed(() => {
  const price = Number(form.value?.pricePerUnit ?? 0)
  const qty = Number(form.value?.totalQuantity ?? 0)
  return price * qty
})

// Add Order modal: button enabled only when case, caseUnit, pricePerUnit, totalQuantity are filled
const addOrderFormValid = computed(() => {
  const f = form.value;
  return !!(
    f?.caseId &&
    f?.caseUnit &&
    f?.pricePerUnit != null && f?.pricePerUnit !== '' &&
    f?.totalQuantity != null && f?.totalQuantity !== ''
  );
});

// If you also want to keep `form.estimatedRevenue` synced:
watch(estimatedRevenue, (val) => {
  form.value.estimatedRevenue = val
})

const hasGoalChanges = computed(() => {
  const ord = selectedOrder.value;
  if (!ord || !ord.agentSummary) return false;

  const originalGoals = ord.agentGoals || {};
  const originalRates = ord.agentRates || {};
  return ord.agentSummary.some(a => {
    const newGoal = Number(a.goalForThisOrder) || 0;
    const oldGoal = Number(originalGoals[a.id]) || 0;
    const newRate = Number(a.rateForThisOrder) || 0;
    const oldRate = Number(originalRates[a.id]) || 0;
    return newGoal !== oldGoal || newRate !== oldRate;
  });
});

const selectOrderForEdit = (item) => {
  selectedOrderId.value = item._id
  selectedOrder.value = item;
  openEditOrderModal();
}

const getFormattedDateRange = () => {
    return formattedDateRange(currentDateRange.value);
}

const getIsCurrentMonth = () => {
    return isCurrentMonth(currentDateRange.value)
}

const getPreviousMonth = () => {
    const prevMonth = goToPreviousMonth(currentDateRange.value);
    updateDateRange(prevMonth);
}

const getNextMonth = () => {
    const nextMonth = goToNextMonth(currentDateRange.value);
    updateDateRange(nextMonth);
}

const updateDateRange = (newRange) => {
    store.commit('setDateRange', newRange); // Use the correct mutation name
}

const getCurrentMonthDateRange = () => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return [formatLocalDate(firstDay), formatLocalDate(lastDay)]
}


const getAgentMonthlyGoalTotals = async (order) => {

const { data } = await axios.get(
  `${urls.backEndURL}/orders/agent-revenue`,
  { params: { from: '2025-08-01', to: '2025-08-31' } }
)

  // const totals = {}
  // console.log('order in month total:', order)
  // // Build a lookup from agentId to agentName
  // const agentNameById = {}
  // agents.value.forEach(agent => {
  //   agentNameById[agent._id] = agent.name
  // })

  // const now = new fctDate()
  // const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  // const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // console.log('Calculating monthly goal totals for range:', firstDay, lastDay, 'for orders:', orders.value.length)

  // orders.value.forEach(order => {
  //   const orderDate = new Date(order.startDate || order.deadline)
  //   if (orderDate >= firstDay && orderDate <= lastDay && order.agentGoals) {
  //     for (const [agentId, goal] of Object.entries(order.agentGoals)) {
  //       if (!totals[agentId]) {
  //         totals[agentId] = {
  //           totalGoals: 0,
  //           agentName: agentNameById[agentId] || 'Unknown Agent',
  //           orders: []
  //         }
  //       }

  //       totals[agentId].totalGoals += goal

  //       const orderName = order.caseName || order._id || 'Unnamed Order'

  //       // Avoid duplicates – check if order already exists for this agent
  //       const existing = totals[agentId].orders.find(o => o.name === orderName)
  //       if (!existing) {
  //         totals[agentId].orders.push({ name: orderName, goal })
  //       } else {
  //         existing.goal += goal // just in case multiple entries exist for same order
  //       }
  //     }
  //   }
  // })

  return data
}

const filteredSortedOrders = computed(() => {
  if (!orders.value || !orders.value.length || !currentDateRange.value || !currentDateRange.value.length) return [];

  // Use string comparison for dates to avoid timezone issues
  const rangeStart = currentDateRange.value[0]; // "YYYY-MM-DD"
  const rangeEnd = currentDateRange.value[1];   // "YYYY-MM-DD"

  return orders.value
    .filter(order => {
      const start = toDateOnly(order.startDate);
      const end = toDateOnly(order.deadline);
      if (!start || !end) return false;
      // Order overlaps with the month range (any overlap counts)
      // String comparison works for YYYY-MM-DD format
      return start <= rangeEnd && end >= rangeStart;
    })
    .sort((a, b) => {
      const aDate = toDateOnly(a.startDate) || '';
      const bDate = toDateOnly(b.startDate) || '';
      return aDate.localeCompare(bDate);
    });
});

function toDateInputString(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  // Pad month and day with leading zeros
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function openAddOrderModal() {
  form.value = defaultForm()
  Object.keys(agentGoals).forEach(k => agentGoals[k] = 0)
  const [startOfMonth, endOfMonth] = getCurrentMonthDateRange()
  form.value.startDate = startOfMonth
  form.value.deadline = endOfMonth
  isEditMode.value = false
  showAddOrderModal.value = true
}

function copyOrder(item) {
  if (!item) return;

  // reset form and local goals
  form.value = defaultForm();
  Object.keys(agentGoals).forEach(k => agentGoals[k] = 0);
  Object.keys(agentRates).forEach(k => agentRates[k] = 0);

  // remember the source order to highlight after successful copy
  pendingCopySourceId.value = item._id;

  const assignedIds = [...new Set(
    (item.assignedCallers || []).map(x => String(x?._id ?? x?.id ?? x))
  )];

  form.value.caseId = item.caseId || null;
  form.value.caseUnit = item.caseUnit || null;
  form.value.pricePerUnit = Number(item.pricePerUnit) || 0;
  form.value.totalQuantity = Number(item.totalQuantity) || 0;
  const [nextStart, nextEnd] = monthDateRangeForNextMonthFrom(item.startDate || currentDateRange.value?.[0]);
  form.value.startDate = nextStart;
  form.value.deadline = nextEnd;
  form.value.orderStatus = item.orderStatus || 'pending';
  form.value.assignedCallers = assignedIds;

  // hydrate agent goals for assigned agents
  const goals = item.agentGoals || {};
  const rates = item.agentRates || {};
  const prices = item.agentPrices || {};
  assignedIds.forEach(id => {
    agentGoals[id] = Number(goals[id]) || 0;
    agentRates[id] = Number(rates[id]) || Number(prices[id]) || 0;
  });

  isEditMode.value = false; // ensure we're creating a new order
  showAddOrderModal.value = true;
}

function openAddAgentModal() {
  resetAgentForm();
  showAddAgentModal.value = true;
}

function openAddCaseModal() {
  resetCaseForm();
  showAddCaseModal.value = true;
}

function openEditOrderModal() {
  if (!selectedOrder.value) return

  // hydrate form from selected order and open modal in edit mode
  const o = selectedOrder.value;
  form.value = defaultForm();

  // basic fields
  form.value.caseId = o.caseId || null;
  form.value.caseUnit = o.caseUnit || null;
  form.value.pricePerUnit = Number(o.pricePerUnit) || 0;
  form.value.totalQuantity = Number(o.totalQuantity) || 0;
  form.value.startDate = toDateInputString(o.startDate) || '';
  form.value.deadline = toDateInputString(o.deadline) || '';
  form.value.orderStatus = o.orderStatus || 'pending';
  form.value.caseType = o.caseType || null;

  // managers -> ids
  const mgrs = Array.isArray(o.managers) ? o.managers : [];
  form.value.managers = mgrs.map(m => m?.id || m?._id || m).filter(Boolean);

  // assigned callers -> ids
  const assignedIds = [...new Set(
    (o.assignedCallers || []).map(x => String(x?._id ?? x?.id ?? x))
  )];
  form.value.assignedCallers = assignedIds;

  // hydrate agent goals/rates for assigned agents
  Object.keys(agentGoals).forEach(k => (agentGoals[k] = 0));
  Object.keys(agentRates).forEach(k => (agentRates[k] = 0));
  const goals = o.agentGoals || {};
  const rates = o.agentRates || {};
  assignedIds.forEach(id => {
    agentGoals[id] = Number(goals[id]) || 0;
    agentRates[id] = Number(rates[id]) || 0;
  });

  isEditMode.value = true;
  showAddOrderModal.value = true;
}

function closeAddOrderModal() {
  showAddOrderModal.value = false;
}

function closeAddAgentModal() {
  showAddAgentModal.value = false;
}

function closeAddCaseModal() {
  showAddCaseModal.value = false;
}

const getDistributedGoals = (order) => {
  return Object.values(order.agentGoals || {}).reduce((sum, val) => sum + val, 0)
}

function editCaseFromOrder(order) {
  if (!order) return;
  // order.caseId can be a string or an object; handle both
  const rawCaseId = order.caseId ?? order.case?._id ?? order.case?.id ?? null;
  const caseId =
    typeof rawCaseId === 'object'
      ? rawCaseId._id ?? rawCaseId.id ?? null
      : rawCaseId;

  if (!caseId) {
    console.warn('editCaseFromOrder: no caseId found on order', order);
    return;
  }

  router.push({
    name: 'addCaseForm',
    query: { caseId },
  });
}

const getOrderPrice = async (orderId) => {
  const list = (typeof orders !== 'undefined' && orders.value) ? orders.value : [];
  const orderPrice = list.find(x => x._id === orderId);
  return Number(orderPrice?.pricePerUnit) || 0;
};

const currency = v =>
  (new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' })).format(v || 0);


async function fetchAgentRevenueAggregates(fromDate, toDate) {

  const from = new Date(fromDate).toISOString();
  const to   = new Date(toDate).toISOString();

  const stats = await axios.get(`${urls.backEndURL}/orders/agent-revenue`, {
      params: { from, to },
      Status: () => true, 
    });
  console.log('Aggregates:', stats.data);

  return stats.data;
  
}

function monthBoundsFrom(dateLike) {
  // Parse date string safely to avoid timezone issues
  const dateStr = toDateOnly(dateLike);
  if (!dateStr) {
    // Fallback to current month
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    };
  }
  const [year, month] = dateStr.split('-').map(Number);
  const from = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const to   = new Date(year, month, 0, 23, 59, 59, 999);
  return { from, to };
}

function overlapsMonth(order, from, to) {
  // Use string-based date comparison to avoid timezone issues
  const startStr = toDateOnly(order.startDate);
  const endStr = toDateOnly(order.deadline);
  if (!startStr || !endStr) return false;
  
  const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
  const toStr = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`;
  
  return startStr <= toStr && endStr >= fromStr;
}

function agentMonthlyStats(agentId, from, to, allOrders) {
  let revenue = 0;
  let ordersCount = 0;

  for (const o of allOrders) {
    if (!overlapsMonth(o, from, to)) continue;

    const assigned = (o.assignedCallers ?? []).map(x => String(x));
    if (!assigned.includes(String(agentId))) continue;

    const price = Number(o.pricePerUnit) || 0;
    const goal  = Number((o.agentGoals ?? {})[agentId]) || 0;

    revenue += price * goal;
    ordersCount += 1;
  }
  return { revenue, orders: ordersCount };
}

// assumes you have: agents (list of agent docs), allOrders (list of all orders), currency() formatter
const selectOrder = async (order, event) => {
  const item = event?.item ?? order;

  selectedOrderId.value = item._id;
  selectedOrder.value = item;
  rightPanelLoading.value = true;

  console.log('Selected order:', item);
  console.log('Selected order ID:', selectedOrderId.value);
  try {
    try {
      console.log('[AssignGoals] Selected order full payload ->\n', JSON.stringify(item, null, 2));
    } catch {}
    console.log('[AssignGoals] Selected case summary', {
      orderId: String(item?._id),
      caseName: item?.caseName,
      caseId: item?.caseId,
      agentGoals: item?.agentGoals,
      agentRates: item?.agentRates,
      agentPrices: item?.agentPrices,
      agentAssignments: item?.agentAssignments,
      assignedCallers: item?.assignedCallers,
    });

    // clear local goals cache
    Object.keys(agentGoals).forEach(k => (agentGoals[k] = 0));

    // full-month window from the order's start date
    const { from, to } = monthBoundsFrom(item.startDate);

    console.log('Calculating goals for order:', item._id, 'from', from, 'to', to);

    const agentStats = await fetchAgentRevenueAggregates(from, to);
    console.log('Agent stats:', agentStats);

    selectedOrder.value.agentSummary = [];

    const orderId   = String(selectedOrder.value._id);
    const price     = Number(selectedOrder.value.pricePerUnit) || 0;
    const goalsObj  = selectedOrder.value.agentGoals || {};
    const ratesObj  = selectedOrder.value.agentRates || {};
    const pricesObj = selectedOrder.value.agentPrices || {};
    const assignments = Array.isArray(selectedOrder.value.agentAssignments)
      ? selectedOrder.value.agentAssignments
      : [];
    const assignedIds = [...new Set(
      (selectedOrder.value.assignedCallers || []).map(x => String(x?._id ?? x?.id ?? x))
    )];

    console.log('[AssignGoals] Incoming agent data sources', {
      goalsObj,
      ratesObj,
      pricesObj,
      assignments,
      assignedIds,
    });

    // build a fast lookup from agentStats
    const statsAgents = agentStats?.agents || [];
    const byId = new Map(statsAgents.map(a => [ String(a.agentId), a ]));

    // build agentSummary only for agents on this order
    selectedOrder.value.agentSummary = assignedIds.map(agentId => {
      const bucket = byId.get(agentId);               // this agent's month bucket (may be undefined)
      const name   = bucket?.agentName || t('assignGoals.unknownAgent');
      const AgentOrders =  bucket?.orders || {};

      const goalForThisOrder = Number(goalsObj[agentId]) || 0;
      const rateFromMap = Number(ratesObj[agentId]) || 0;
      const rateFromAssignments = Number(assignments.find(a => String(a.id) === agentId)?.rate) || 0;
      const rateFromPrices = Number(pricesObj[agentId]) || 0;
      const rateForThisOrder = rateFromMap || rateFromAssignments || rateFromPrices || 0;

      console.log('[AssignGoals] Agent rate resolution', {
        agentId,
        name,
        rateFromMap,
        rateFromAssignments,
        rateFromPrices,
        chosenRate: rateForThisOrder,
      });

      // prefer the order entry from bucket.orders if present; fallback to goal*price
      const orderEntry = bucket?.orders?.find(o => String(o.orderId) === orderId);
      const revenueForThisOrder = Number(orderEntry?.revenue) || (goalForThisOrder * price);

      return {
        AgentOrders: AgentOrders,
        id: agentId,
        name,
        goalForThisOrder,
        rateForThisOrder,
        revenueForThisOrder,
        revenueForThisOrderFormatted: currency(revenueForThisOrder),

        // optional: include month totals from the stats bucket
        monthRevenue: Number(bucket?.totals?.revenue ?? bucket?.totalRevenue) || 0,
        monthOrders:  Number(bucket?.totals?.orders)  || (bucket?.orders?.length ?? 0),
      };
    });

    console.log('Agent summary:', selectedOrder.value.agentSummary);
  } finally {
    rightPanelLoading.value = false;
  }
};



const deleteOrder = async (orderId) => {
  const confirmDelete = confirm(t('assignGoals.confirmDelete'))
  if (!confirmDelete) return

  await axios.delete(`${urls.backEndURL}/orders/${orderId}`)
  await fetchAllData();
  if (selectedOrder.value && selectedOrder.value._id === orderId) {
    selectedOrder.value = null
  }
}

const assignGoals = async () => {
  if (!selectedOrder.value) return;
  try {
    // Prepare the updated order object
    const updatedOrder = {
      ...selectedOrder.value,
      agentGoals: { ...agentGoals },
      agentRates: Object.fromEntries(
        (selectedOrder.value.agentSummary || []).map(a => [a.id, Number(a.rateForThisOrder) || 0])
      ),
      agentPrices: Object.fromEntries(
        (selectedOrder.value.agentSummary || []).map(a => [a.id, Number(a.rateForThisOrder) || 0])
      ),
      agentAssignments: (selectedOrder.value.agentSummary || []).map(a => ({
        id: a.id,
        name: a.name,
        goal: Number(a.goalForThisOrder) || 0,
        rate: Number(a.rateForThisOrder) || 0,
      })),
    };
    // Send the update request
    console.log('Updating order with goals:', updatedOrder);
    await axios.put(`${urls.backEndURL}/orders/${selectedOrder.value._id}`, updatedOrder);
    // Optionally refresh orders here if needed
    await fetchAllData();
     // Reselect the updated order from the new orders array
    const updated = orders.value.find(o => o._id === selectedOrder.value._id);
    if (updated) selectedOrder.value = updated;
  } catch (err) {
    console.error('Failed to update order:', err.response?.data || err.message);
    alert(t('assignGoals.failedToSaveGoals'));
  }
};

const submitGoals = async () => {
  savingGoals.value = true;
  try {
    await assignGoals();
  } finally {
    savingGoals.value = false;
  }
}

const agentOptions = computed(() => agents.value.map(a => ({
  value: a._id,
  title: a.name
})))

const caseOptions = computed(() => (cases.value || []).map(c => ({
  value: c._id,
  title: c.name
})))

const caseUnits = ['hours', 'interviews', 'meetings']
const orderStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold']

const assignedGoalsCount = computed(() =>
  form.assignedCallers.reduce((sum, id) => sum + (Number(agentGoals[id]) || 0), 0)
);

const agentName = id => {
  const agent = agents.value.find(a => a._id === id);
  return agent ? agent.name : id;
};

const resetForm = () => {
  form.caseId = '';
  form.caseUnit = '';
  form.totalQuantity = '';
  form.pricePerUnit = '';
  form.startDate = '';
  form.deadline = '';
  form.orderStatus = '';
  form.estimatedRevenue = '';
  form.assignedCallers = [];
  Object.keys(agentGoals).forEach(k => agentGoals[k] = 0);
};

function resetAgentForm() {
  agent.value = {
    name: '',
    email: '',
    role: '',
    active: true
  };
  message.value = '';
  alertType.value = 'success';
}

function resetCaseForm() {
  gcCase.value = {
    name: '',
    contactInfo: {
      contactName: '',
      contactTitle: '',
      email: ''
    }
  };
}

const submitOredrForm = async () => {
  try {
    const selectedCase = cases.value.find(c => c._id === form.value.caseId)

    const payload = {
      ...toRaw(form.value), // remove Vue reactivity
      estimatedRevenue: estimatedRevenue.value, // ensure computed is included
      caseName: selectedCase ? selectedCase.name : '',
      agentGoals: { ...agentGoals },
      agentRates: { ...agentRates },
    agentPrices: { ...agentRates }, // legacy mirror for backend compatibility
      agentAssignments: (form.value.assignedCallers || []).map(id => ({
        id,
        name: agentName(id),
        goal: Number(agentGoals[id]) || 0,
        rate: Number(agentRates[id]) || 0,
      })),
      managers: (form.value.managers || []).map(id => {
        const agent = gcAgents.value.find(a => a._id === id)
        return agent ? { id, name: agent.name } : { id, name: '' }
      })
    }

    if (isEditMode.value && selectedOrder.value) {
      // Edit mode: update the order
      console.log('Updating order:', selectedOrder.value._id, payload)
      await axios.put(`${urls.backEndURL}/orders/${selectedOrder.value._id}`, {
        ...toRaw(selectedOrder.value),
        ...payload
      })
    } else {
      // Add mode: create a new order
      await axios.post(`${urls.backEndURL}/orders/`, payload)
      // mark the source order as copied for green highlight
      if (pendingCopySourceId.value) {
        copiedToNextMonth[String(pendingCopySourceId.value)] = true;
        pendingCopySourceId.value = null;
        saveCopiedFlags();
      }
    }

    await fetchAllData()
    try { deriveCopiedFlagsFromOrders(orders.value || []); } catch {}

    if (isEditMode.value && selectedOrder.value) {
      const updated = orders.value.find(o => o._id === selectedOrder.value._id)
      if (updated) selectedOrder.value = updated
    }

    resetForm()
    closeAddOrderModal()
  } catch (err) {
    console.error('Failed to save order:', err.response?.data || err.message)
  }
}

const submitAgentForm = async () => {
  const me = this;
  try {
    const response = await axios.post(`${urls.backEndURL}/gcAgents/`, agent.value)
    console.log('Agent added:', response.data)
    // reset form
    resetAgentForm()
    closeAddAgentModal();
    me.alertType = "success";
    setTimeout(() => {
            me.message = "";
    }, 3000);
  } catch (err) {
    console.error('Error adding agent:', err.response?.data || err.message)
  }
}

const submitCaseForm = async () => {
  try {
     const response = await axios.post(`${urls.backEndURL}/gcCases/`, {
      name: gcCase.value.name,
      contactInfo: gcCase.value.contactInfo
    })
    console.log('Case added:', response.data)
    // reset form
    resetCaseForm()
    closeAddCaseModal();
  } catch (err) {
    console.error(err)
    console.log('Failed in adding case.', err)
  }
}


onMounted(async () => {

  await fetchAllData()
  try { await store.dispatch('fetchCaseTypes') } catch {}
  console.log('orders:', orders.value);

  loadCopiedFlags();
  // derive historical copied flags so past copies show up (e.g., Oct -> Nov)
  try { deriveCopiedFlagsFromOrders(orders.value || []); } catch {}

  if (!currentDateRange || currentDateRange.length < 2) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      // Use local dates to avoid timezone shifting in inputs
      const startDate = new Date(year, month, 1); // First day of current month
      const endDate = new Date(year, month + 1, 0); // Last day of current month
      updateDateRange([formatLocalDate(startDate), formatLocalDate(endDate)]); // Set the default date range
    }
    console.log('filteredSortedOrders',filteredSortedOrders.value)

})

watch(
  () => [orders.value, currentDateRange.value?.[0], currentDateRange.value?.[1]],
  () => {
    recomputeCopiedFlags();
  },
  { deep: true }
)

</script>
<style>
  ::v-deep(.selected-row) {
    background-color: #e0f7fa !important; /* light blue */
  }
  ::v-deep(.copied-row) {
    background-color: #e8f5e9 !important; /* light green */
  }
  /* Mobile styles for Assign Goals */
  .assign-goals .responsive-toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
  .assign-goals .mobile-scroll {
    overflow-x: auto;
  }
  @media (max-width: 600px) {
    .assign-goals {
      width: 100% !important;
      padding: 0 8px;
    }
  }
</style>