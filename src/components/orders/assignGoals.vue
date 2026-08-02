<template>
  <v-container fluid style="width: 90%;" class="assign-goals">
    <!-- Date Navigation Header (matches ordersDashboard) -->
    <DateHeader
      :currentDateRange="currentDateRange"
      :monthWeeks="monthWeeks"
      :showMonthOnly="true"
      @prev="getPreviousMonth"
      @next="getNextMonth"
    />

    <v-card elevation="1" class="mb-4">
        <div class="d-flex align-center justify-space-around responsive-toolbar flex-wrap" style="gap: 12px;">

            <v-btn color="primary" @click="openAddAgentModal">
                {{ t('assignGoals.buttons.addAgent') }}
            </v-btn>

            <v-btn color="primary" @click="openAddCaseModal">
                {{ t('assignGoals.buttons.addCustomer') }}
            </v-btn>

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
                :disabled="bulkCopyDisabled"
                :loading="bulkCopying"
                @click="bulkCopyOrdersToNextMonth"
            >
                {{ bulkCopyButtonLabel }}
            </v-btn>
        </div>
    </v-card>

    <h1 class="text-h4 mb-4" style="width: 100%;">{{ t('buttons.assignGoals') }} - {{ getFormattedDateRange() }}</h1>

    <v-row>
      <!-- Orders grouped by case type (match ordersDashboard layout) -->
      <v-col cols="12" md="7">
        <div
          v-for="group in groupedOrdersByCaseTypeAssignGoals"
          :key="group.caseType"
          class="mb-6"
        >
          <v-card elevation="2" class="mb-2">
            <v-card-title class="text-h6">
              {{ group.caseType === 'Unspecified'
                ? t('ordersDashboard.unspecified')
                : (group.caseType || t('ordersDashboard.unspecified')) }}
              <v-chip size="small" class="ml-2">
                {{ group.items.length }}
                {{ group.items.length === 1 ? t('ordersDashboard.case') : t('ordersDashboard.cases') }}
              </v-chip>
            </v-card-title>
          </v-card>

          <v-card elevation="1">
            <v-data-table
              :headers="orderHeaders"
              :items="group.items"
              item-value="_id"
              class="elevation-1 mobile-scroll assign-goals-orders-table"
              :items-per-page="20"
              density="comfortable"
              fixed-header
              show-expand
              :cell-props="getAssignGoalsCellProps"
              :expanded="group.items.filter((i) => orderSpansMultipleMonths(i) && expandedRows.has(String(i._id))).map((i) => i._id)"
              @update:expanded="(value) => { expandedRows = new Set(value) }"
              @click:row="selectOrder"
            >
          <template #header.select>
            <v-checkbox-btn
              :model-value="isGroupAllCopySelected(group.items)"
              :indeterminate="isGroupSomeCopySelected(group.items)"
              density="compact"
              hide-details
              @update:model-value="(v) => setGroupCopySelection(group.items, v)"
            />
          </template>
          <template #header.data-table-expand>
            <span></span>
          </template>
          <template #item="{ item, props: rowProps, index }">
            <VDataTableRow v-bind="rowProps">
              <template #item.select="{ item: rowItem }">
                <v-checkbox-btn
                  :model-value="isCopyOrderSelected(rowItem._id)"
                  :disabled="isOrderCopyDisabled(rowItem)"
                  density="compact"
                  hide-details
                  @click.stop
                  @update:model-value="(v) => setCopyOrderSelected(rowItem._id, v)"
                />
              </template>
              <template #item.data-table-expand="{ item: rowItem }">
                <v-btn
                  v-if="orderSpansMultipleMonths(rowItem)"
                  icon
                  size="small"
                  variant="text"
                  @click.stop="toggleExpand(rowItem._id)"
                >
                  <v-icon>{{ expandedRows.has(String(rowItem._id)) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </v-btn>
                <span v-else aria-hidden="true"></span>
              </template>
              <template #item.copy="{ item: rowItem }">
                <v-tooltip
                  :text="copyOrderDisabledTooltip(rowItem)"
                  location="top"
                >
                  <template #activator="{ props: tipProps }">
                    <v-btn
                      v-bind="tipProps"
                      icon
                      variant="text"
                      size="small"
                      color="grey"
                      class="mr-2"
                      :disabled="isOrderCopyDisabled(rowItem)"
                      @click.stop="copyOrder(rowItem)"
                    >
                      <v-icon>mdi-content-copy</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
              </template>
              <template #item.caseName="{ item: rowItem }">
                <div class="case-cell-block" @click.stop>
                  <div class="d-flex align-center flex-wrap case-cell-block__header">
                    <span class="mr-2">{{ rowItem.caseName }}</span>
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      color="grey"
                      :title="t('orderDetails.editCase')"
                      @click.stop="editCaseFromOrder(rowItem)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-chip
                      v-if="orderSpansMultipleMonths(rowItem)"
                      size="x-small"
                      color="primary"
                      class="ml-1"
                    >
                      {{ t('ordersDashboard.multiMonth') }}
                    </v-chip>
                    <v-chip
                      v-if="isOrderOnHold(rowItem)"
                      size="x-small"
                      color="warning"
                      class="ml-1"
                    >
                      {{ t('ordersDashboard.onPause') }}
                    </v-chip>
                    <v-chip
                      v-if="isOrderPending(rowItem)"
                      size="x-small"
                      color="grey"
                      variant="tonal"
                      class="ml-1"
                    >
                      {{ t('ordersDashboard.pending') }}
                    </v-chip>
                    <v-chip
                      v-if="isOrderCompleted(rowItem)"
                      size="x-small"
                      color="success"
                      variant="tonal"
                      class="ml-1"
                    >
                      {{ t('ordersDashboard.completed') }}
                    </v-chip>
                    <v-chip
                      v-if="isCopiedToNextMonth(rowItem)"
                      size="x-small"
                      color="success"
                      variant="tonal"
                      class="ml-1"
                    >
                      {{ t('assignGoals.copiedToNextMonth') }}
                    </v-chip>
                  </div>
                </div>
              </template>
              <template #item.orderId="{ item: rowItem }">
                <span class="text-medium-emphasis">{{ rowItem._id ?? '—' }}</span>
              </template>
              <template #item.monthlyGoal="{ item: rowItem }">
                {{ rowItem.monthlyGoal ?? rowItem.totalQuantity ?? '—' }}
              </template>
              <template #item.goalsDistributed="{ item: rowItem }">
                {{ getDistributedGoals(rowItem) }}
              </template>
              <template #item.campaignGoal="{ item: rowItem }">
                {{ getCampaignGoalDisplay(rowItem) }}
              </template>
              <template #item.goalsRemaining="{ item: rowItem }">
                <span :class="{ 'text-primary font-weight-medium': getRemainingGoals(rowItem) > 0 }" :title="getRemainingGoals(rowItem) > 0 ? t('assignGoals.goalsRemainingTooltip') : ''">
                  {{ getRemainingGoals(rowItem) }}
                </span>
              </template>
              <template #item.caseUnit="{ item: rowItem }">
                {{ rowItem.caseUnit }}
              </template>
              <template #item.edit="{ item: rowItem }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="grey"
                  class="mr-2"
                  :title="t('assignGoals.tableHeaders.edit')"
                  @click.stop="selectOrderForEdit(rowItem)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <template #item.actions="{ item: rowItem }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="grey"
                  class="mr-2"
                  :title="t('assignGoals.tableHeaders.delete')"
                  @click.stop="deleteOrder(rowItem._id)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </VDataTableRow>
            <tr
              :class="getCaseOrderStatusRowClass(item, index)"
              :data-case-stripe="String(Number(index) % 2)"
              @click="selectOrder(item, { item })"
            >
              <td
                :colspan="orderTableColumnCount"
                class="case-order-status-row__body"
                :style="getCaseRowBackgroundStyle(item, index)"
                @click.stop
              >
                <div class="case-cell-block__status order-status-radios-row text-caption text-medium-emphasis">
                  <span class="order-status-label mr-2">{{ t('assignGoals.formLabels.orderStatus') }}</span>
                  <v-radio-group
                    class="order-status-radios"
                    :model-value="getOrderStatusForMonth(item, currentMonthKey)"
                    inline
                    hide-details
                    density="compact"
                    :disabled="statusUpdatingId === String(item._id)"
                    @update:model-value="(v) => updateOrderStatus(item, v)"
                  >
                    <v-radio
                      v-for="status in ORDER_STATUS_OPTIONS"
                      :key="status"
                      :value="status"
                      density="compact"
                    >
                      <template #label>
                        <span class="text-caption text-medium-emphasis">{{ status }}</span>
                      </template>
                    </v-radio>
                  </v-radio-group>
                </div>
              </td>
            </tr>
          </template>

          <template #expanded-row="{ item, index }">
            <tr
              v-if="orderSpansMultipleMonths(item) && item.monthlyBreakdown"
              class="monthly-breakdown-row"
              :data-case-stripe="String(Number(index) % 2)"
            >
              <td class="monthly-breakdown-row__expand" :style="getCaseRowBackgroundStyle(item, index)"></td>
              <td class="monthly-breakdown-row__select" :style="getCaseRowBackgroundStyle(item, index)"></td>
              <td
                :colspan="orderHeaders.length"
                class="monthly-breakdown-row__body"
                :style="getCaseRowBackgroundStyle(item, index)"
              >
                <div class="pa-3 pt-0" @click.stop>
                  <h3 class="text-subtitle-1 mb-2">{{ t('ordersDashboard.monthlyBreakdown.title') }}</h3>
                  <div class="monthly-breakdown-scroll" style="overflow-x: auto; overflow-y: visible;">
                    <v-table density="compact" style="min-width: 600px;">
                      <thead>
                        <tr>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.month') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.dateRange') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.quantityCompleted') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.revenue') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.goal') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.percentageToGoal') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.remaining') }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="month in item.monthlyBreakdown" :key="month.monthKey">
                          <td>{{ getMonthName(month.month) }} {{ month.year }}</td>
                          <td>{{ formatDateDetailed(month.startDateStr) }} - {{ formatDateDetailed(month.endDateStr) }}</td>
                          <td>{{ formatSlashPair(month.quantityCompleted, getDisplayGoal(item)) }}</td>
                          <td>{{ formatCurrency(month.revenue) }}</td>
                          <td>{{ formatCurrency(getMonthlyRevenueGoal(item, month)) }}</td>
                          <td>
                            <span :class="['percentage-badge', getMonthlyPercentageToGoalClass(item, month)]">
                              {{ formatStatNumber(getMonthlyPercentageToGoal(item, month)) }}%
                            </span>
                          </td>
                          <td>{{ formatStatNumber(Math.max(0, getDisplayGoal(item) - getTotalCompletedUpToMonth(item.monthlyBreakdown, month.monthKey))) }}</td>
                        </tr>
                        <tr class="font-weight-bold">
                          <td colspan="2">{{ t('ordersDashboard.monthlyBreakdown.total') }}</td>
                          <td>{{ formatSlashPair(getTotalQuantity(item.monthlyBreakdown), getDisplayGoal(item)) }}</td>
                          <td>{{ formatCurrency(getTotalRevenue(item.monthlyBreakdown)) }}</td>
                          <td></td>
                          <td></td>
                          <td>{{ formatStatNumber(Math.max(0, getDisplayGoal(item) - getTotalQuantity(item.monthlyBreakdown))) }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>
    </div>
      </v-col>

      <!-- Agent Assignment -->
     <!-- Agent Assignment -->
<v-col cols="12" md="5" class="pa-4">
  <h3 class="text-h6 mb-2">
    {{ t('assignGoals.assignGoalsFor') }} ({{ selectedOrder && selectedOrder.caseName || t('assignGoals.noOrderSelected') }})
  </h3>
  <v-alert
    v-if="selectedOrder && selectedOrderRemainingGoals > 0"
    type="info"
    variant="tonal"
    density="compact"
    class="mb-3"
  >
    {{ t('assignGoals.goalsRemainingToAssign') }}: <strong>{{ formatStatNumber(selectedOrderRemainingGoals) }}</strong>
  </v-alert>

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
              <div class="text-caption mb-1 text-grey">
                {{ t('assignGoals.thisMonth') }}
                <span v-if="currentMonthLabel">({{ currentMonthLabel }})</span>
              </div>
              <div class="mb-2">
                {{ formatStatNumber(agent.completedUnitsForThisOrder ?? 0) }}/{{ formatStatNumber(agent.goalForThisOrder) }} {{ t('assignGoals.totalGoals') }}
              </div>

              <div class="text-caption mb-1 text-grey">{{ t('assignGoals.otherOrders') }}</div>
              <ul class="pl-3">
                <li
                  v-for="o in agent.AgentOrders"
                  :key="o.orderId || o._oid || o.name"
                >
                  {{ o.caseName || o.name }} – {{ formatStatNumber(o.goal) }}
                  <span v-if="o.pricePerUnit">
                    ({{ formatCurrency((Number(o.goal) || 0) * (Number(o.pricePerUnit) || 0)) }})
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
            {{ orderFormConfig.mode === 'edit' ? t('assignGoals.modals.editOrder') : t('assignGoals.modals.addNewOrder') }}
        </v-card-title>
        <v-card-text class="overflow-y-auto" style="max-height: 70vh;">
        <OrderForm
            :key="orderFormModalKey"
            :order-id="orderFormConfig.orderId"
            :initial-order="orderFormConfig.initialOrder"
            :prefill="orderFormConfig.prefill"
            :default-start-date="orderFormConfig.defaultDates?.startDate"
            :default-deadline="orderFormConfig.defaultDates?.deadline"
            :modal="true"
            @saved="onOrderFormSaved"
            @cancelled="closeAddOrderModal"
        />
        </v-card-text>
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
                    v-model="gcCase.nickname"
                    :label="t('assignGoals.formLabels.nickname')"
                    :hint="t('assignGoals.formLabels.nicknameHint')"
                    persistent-hint
                    clearable
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
import { ref, onMounted, computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth, getMonthWeeks } from '@/js/dateUtils';
import { orderSpansMultipleMonths, calculateMonthlyProgress } from '@/js/statsUtils';
import DateHeader from '@/components/DateHeader.vue';
import OrderForm from '@/components/orders/OrderForm.vue';
import axios from 'axios'
import urls from '@/js/config.js'
import { getPercentageToGoalBadgeClass } from '@/js/percentageToGoalStyle'
import { formatSlashPair, formatStatNumber, formatCurrencyEUR, roundTo2Decimals } from '@/js/formatNumbers'
import {
  buildOrderCopyPayload,
  buildOrderCopyPrefill,
  resolveOrderCopyFields,
} from '@/js/orderCopyUtils'
import {
  ORDER_STATUS_OPTIONS,
  normalizeOrderStatus,
  getOrderStatusForMonth,
  isOrderOnHoldForMonth,
  isOrderCompletedForMonth,
  isOrderPendingForMonth,
  buildMonthlyOrderStatusUpdate,
  monthKeyFromDateRange,
} from '@/js/orderStatusUtils'

const store = useStore()
const router = useRouter()
const { t } = useI18n()
const agentForm = ref(null);
const caseForm = ref(null);
const selectedOrder = ref(null)
const selectedOrderId = ref(null)
const rightPanelLoading = ref(false)
const isEditMode = ref(false);
const statusUpdatingId = ref(null)
const orderStatusOptions = ORDER_STATUS_OPTIONS

function getCaseRowStripeClass(index) {
  return Number(index) % 2 === 1 ? 'case-row-group--alt' : ''
}

function getCaseRowBackgroundColor(item, index) {
  const id = String(item?._id ?? '')
  if (id === String(selectedOrderId.value ?? '')) {
    return '#e0f7fa'
  }
  if (Number(index) % 2 === 1) {
    return '#f5f5f5'
  }
  return undefined
}

function getCaseRowBackgroundStyle(item, index) {
  const backgroundColor = getCaseRowBackgroundColor(item, index)
  return backgroundColor ? { backgroundColor } : undefined
}

function getAssignGoalsCellProps({ item, index }) {
  const backgroundColor = getCaseRowBackgroundColor(item, index)
  return backgroundColor ? { style: { backgroundColor } } : {}
}

function getCaseOrderStatusRowClass(item, index) {
  const id = String(item?._id ?? '')
  return [
    'case-data-row',
    'case-order-status-row',
    getCaseRowStripeClass(index),
    id === String(selectedOrderId.value ?? '') ? 'selected-row' : '',
  ].filter(Boolean).join(' ')
}

function isCopiedToNextMonth(item) {
  const id = String(item?._id ?? '')
  return !!copiedToNextMonth[id]
}

const showEditOrderModal = ref(false);
const showAddCaseModal = ref(false);
const showAddAgentModal = ref(false);
const showAddOrderModal = ref(false);
const orderFormModalKey = ref(0);
const orderFormConfig = ref({
  mode: 'add',
  orderId: null,
  initialOrder: null,
  prefill: null,
  defaultDates: null
});

const copiedToNextMonth = reactive({});
const pendingCopySourceId = ref(null);
const bulkCopying = ref(false);
const selectedCopyOrderIds = ref(new Set());
const expandedRows = ref(new Set());

function toggleExpand(id) {
  const key = String(id);
  const next = new Set(expandedRows.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  expandedRows.value = next;
}

// Monthly breakdown helpers (mirrors ordersDashboard)
const formatCurrency = formatCurrencyEUR
function getMonthName(monthNum) {
  const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december']
  const key = monthKeys[monthNum - 1]
  return key ? t(`ordersDashboard.months.${key}`) : ''
}

function formatDateDetailed(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

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

  const ordersToCopy = ordersForBulkCopy.value;
  if (!ordersToCopy.length) {
    console.warn('📋 Bulk copy: No orders to copy');
    return;
  }
  
  try {
    bulkCopying.value = true;
    
    // Take a snapshot of source orders to prevent reactivity issues
    const sourceOrders = [...ordersToCopy];
    const selectionMode = selectedCopyOrderIds.value.size > 0;
    console.log(
      `📋 Bulk copy: Starting copy of ${sourceOrders.length} orders${selectionMode ? ' (selected)' : ''}`
    );

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
    let multiMonthSkippedCount = 0;
    let copiedCount = 0;
    let failedCount = 0;
    
    // Track what we create during this run to prevent duplicates within the batch
    const createdKeys = new Set();
    
    // Helper to create a unique key for duplicate detection
    const orderKey = (caseId, caseUnit, pricePerUnit) => 
      `${String(caseId || '')}|${String(caseUnit || '')}|${Number(pricePerUnit || 0)}`;

    for (const o of sourceOrders) {
      if (orderSpansMultipleMonths(o)) {
        console.log(`📋 Bulk copy: Skipping "${o.caseName}" (multi-month campaign)`);
        multiMonthSkippedCount++;
        continue;
      }

      if (isOrderCompletedForMonth(o, monthKeyFromDateRange(currentDateRange.value))) {
        console.log(`📋 Bulk copy: Skipping "${o.caseName}" (completed for this month)`);
        skippedCount++;
        continue;
      }

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

      const copyFields = resolveOrderCopyFields(
        o,
        nextStart,
        nextEnd,
        getRemainingCampaignGoalForCopy
      );
      const payload = buildOrderCopyPayload(o, copyFields, {
        agents: gcAgents.value || [],
        sourceMonthStart: currentStart,
        targetMonthStart: nextStart,
      });

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

    console.log(
      `📋 Bulk copy complete: ${copiedCount} copied, ${skippedCount} skipped (duplicates), ${multiMonthSkippedCount} multi-month excluded, ${failedCount} failed`
    );

    saveCopiedFlags();
    selectedCopyOrderIds.value = new Set();
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
const dailyLogs = computed(() => store.getters['dailyLogs'] || [])
const agents = gcAgents
const currentDateRange = computed(() => store.getters['currentDateRange'])

const currentMonthKey = computed(() => monthKeyFromDateRange(currentDateRange.value))
const monthWeeks = ref([])
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

// Human-readable label for the currently selected month in the toolbar
const currentMonthLabel = computed(() => {
  const range = currentDateRange.value
  if (!range || !range.length) return ''
  const start = new Date(range[0])
  return start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
})

const orderHeaders = computed(() => [
  { title: '', key: 'select', sortable: false, width: '48px' },
  { title: t('assignGoals.tableHeaders.caseName'), key: 'caseName', minWidth: '180px' },
  { title: t('assignGoals.tableHeaders.orderId'), key: 'orderId', sortable: false },
  { title: t('assignGoals.tableHeaders.totalGoals'), key: 'monthlyGoal' },
  { title: t('assignGoals.tableHeaders.campaignGoal'), key: 'campaignGoal', sortable: false },
  { title: t('assignGoals.tableHeaders.goalsDistributed'), key: 'goalsDistributed', sortable: false },
  { title: t('assignGoals.tableHeaders.goalsRemaining'), key: 'goalsRemaining', sortable: false },
  { title: t('assignGoals.tableHeaders.priceUnit'), key: 'caseUnit' },
  { title: t('assignGoals.tableHeaders.edit'), key: 'edit', sortable: false },
  { title: t('assignGoals.tableHeaders.copy'), key: 'copy', sortable: false },
  { title: t('assignGoals.tableHeaders.delete'), key: 'actions', sortable: false }
])

// expand column + orderHeaders
const orderTableColumnCount = computed(() => orderHeaders.value.length + 1)

const agent = ref({
  name: '',
  email: '',
  role: '',
  active: true
})

const gcCase = ref({
  name: '',
  nickname: '',
  contactInfo: {
    contactName: '',
    contactTitle: '',
    email: ''
  }
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

// Remaining goals for selected order using live form values (updates as user edits)
const selectedOrderRemainingGoals = computed(() => {
  const ord = selectedOrder.value;
  if (!ord) return 0;
  const total = Number(ord.monthlyGoal ?? ord.totalQuantity ?? 0) || 0;
  let distributed = 0;
  if (ord.agentSummary?.length) {
    distributed = ord.agentSummary.reduce((sum, a) => sum + (Number(a.goalForThisOrder) || 0), 0);
  } else {
    distributed = getDistributedGoals(ord);
  }
  return Math.max(0, total - distributed);
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

  // Filter to orders overlapping the selected month
  let list = orders.value
    .filter(order => {
      const start = toDateOnly(order.startDate);
      const end = toDateOnly(order.deadline);
      if (!start || !end) return false;
      // Order overlaps with the month range (any overlap counts)
      // String comparison works for YYYY-MM-DD format
      return start <= rangeEnd && end >= rangeStart;
    })
    .map(order => {
      // Enrich with multi-month information (same as ordersDashboard)
      const isMultiMonth = orderSpansMultipleMonths(order);
      const logs = Array.isArray(dailyLogs.value) ? dailyLogs.value : [];
      const monthlyBreakdown = isMultiMonth ? calculateMonthlyProgress(order, logs) : null;
      return {
        ...order,
        isMultiMonth,
        monthlyBreakdown,
      };
    });

  // Sort like ordersDashboard: by caseType, then by caseName; "Unspecified" last
  list.sort((a, b) => {
    const typeA = a.caseType || 'Unspecified';
    const typeB = b.caseType || 'Unspecified';
    if (typeA !== typeB) {
      if (typeA === 'Unspecified') return 1;
      if (typeB === 'Unspecified') return -1;
      return String(typeA).localeCompare(String(typeB));
    }
    const nameA = String(a.caseName || '').toLowerCase();
    const nameB = String(b.caseName || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return list;
});

const ordersForBulkCopy = computed(() => {
  const list = filteredSortedOrders.value || [];
  if (selectedCopyOrderIds.value.size > 0) {
    return list.filter((o) => selectedCopyOrderIds.value.has(String(o._id)));
  }
  return list;
});

const bulkCopyButtonLabel = computed(() => {
  const count = selectedCopyOrderIds.value.size;
  if (count > 0) {
    return t('assignGoals.buttons.copySelectedCases', { count });
  }
  return t('assignGoals.buttons.bulkCopyCampaigns');
});

const bulkCopyDisabled = computed(() => {
  if (bulkCopying.value) return true;
  if (selectedCopyOrderIds.value.size > 0) return false;
  return !(filteredSortedOrders.value?.length);
});

function isCopyOrderSelected(id) {
  return selectedCopyOrderIds.value.has(String(id));
}

function setCopyOrderSelected(id, selected) {
  const order = (filteredSortedOrders.value || []).find((o) => String(o._id) === String(id))
  if (order && isOrderCopyDisabled(order)) return
  const next = new Set(selectedCopyOrderIds.value);
  const key = String(id);
  if (selected) next.add(key);
  else next.delete(key);
  selectedCopyOrderIds.value = next;
}

function copyableItemsInGroup(items) {
  return (items || []).filter((o) => !isOrderCopyDisabled(o));
}

function isOrderCompleted(order) {
  return isOrderCompletedForMonth(order, currentMonthKey.value)
}

function isOrderPending(order) {
  return isOrderPendingForMonth(order, currentMonthKey.value)
}

function isOrderCopyDisabled(order) {
  return orderSpansMultipleMonths(order) || isOrderCompleted(order)
}

function copyOrderDisabledTooltip(order) {
  if (orderSpansMultipleMonths(order)) {
    return t('assignGoals.copyMultiMonthDisabled')
  }
  if (isOrderCompleted(order)) {
    return t('assignGoals.copyCompletedDisabled')
  }
  return t('assignGoals.tableHeaders.copy')
}

function isGroupAllCopySelected(items) {
  const copyable = copyableItemsInGroup(items);
  if (!copyable.length) return false;
  return copyable.every((o) => isCopyOrderSelected(o._id));
}

function isGroupSomeCopySelected(items) {
  const copyable = copyableItemsInGroup(items);
  const selectedCount = copyable.filter((o) => isCopyOrderSelected(o._id)).length;
  return selectedCount > 0 && selectedCount < copyable.length;
}

function setGroupCopySelection(items, selected) {
  const next = new Set(selectedCopyOrderIds.value);
  for (const o of copyableItemsInGroup(items)) {
    const key = String(o._id);
    if (selected) next.add(key);
    else next.delete(key);
  }
  selectedCopyOrderIds.value = next;
}

watch(currentDateRange, () => {
  selectedCopyOrderIds.value = new Set();
});

// Group filtered orders by case type (match ordersDashboard grouping)
const groupedOrdersByCaseTypeAssignGoals = computed(() => {
  const groups = {};

  // Initialize groups for all known case types
  (caseTypes.value || []).forEach(type => {
    groups[type] = {
      caseType: type,
      items: [],
    };
  });

  // Ensure an "Unspecified" group
  if (!groups['Unspecified']) {
    groups['Unspecified'] = {
      caseType: 'Unspecified',
      items: [],
    };
  }

  // Distribute orders into groups
  filteredSortedOrders.value.forEach(order => {
    const type = order.caseType || 'Unspecified';
    if (!groups[type]) {
      groups[type] = {
        caseType: type,
        items: [],
      };
    }
    groups[type].items.push(order);
  });

  // Sort items in each group alphabetically by case name
  Object.values(groups).forEach(group => {
    group.items.sort((a, b) => {
      const nameA = String(a.caseName || '').toLowerCase();
      const nameB = String(b.caseName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  });

  // Return non-empty groups, sorted by case type, with "Unspecified" last
  return Object.values(groups)
    .filter(group => group.items.length > 0)
    .sort((a, b) => {
      if (a.caseType === 'Unspecified') return 1;
      if (b.caseType === 'Unspecified') return -1;
      return String(a.caseType).localeCompare(String(b.caseType));
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
  const [startOfMonth, endOfMonth] = getCurrentMonthDateRange()
  orderFormConfig.value = {
    mode: 'add',
    orderId: null,
    initialOrder: null,
    prefill: null,
    defaultDates: { startDate: startOfMonth, deadline: endOfMonth }
  }
  orderFormModalKey.value++
  isEditMode.value = false
  showAddOrderModal.value = true
}

function copyOrder(item) {
  if (!item) return;
  if (isOrderCopyDisabled(item)) return;

  pendingCopySourceId.value = item._id;

  const sourceMonthStart = currentDateRange.value?.[0] || item.startDate;
  const [nextStart, nextEnd] = monthDateRangeForNextMonthFrom(sourceMonthStart);
  const copyFields = resolveOrderCopyFields(
    item,
    nextStart,
    nextEnd,
    getRemainingCampaignGoalForCopy
  );

  orderFormConfig.value = {
    mode: 'copy',
    orderId: null,
    initialOrder: null,
    prefill: buildOrderCopyPrefill(item, copyFields, {
      sourceMonthStart,
      targetMonthStart: nextStart,
    }),
    defaultDates: null
  };
  orderFormModalKey.value++;
  isEditMode.value = false;
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
  if (!selectedOrder.value) return;

  const o = selectedOrder.value;
  orderFormConfig.value = {
    mode: 'edit',
    orderId: o._id ?? o.id,
    initialOrder: o,
    prefill: null,
    defaultDates: null
  };
  orderFormModalKey.value++;
  isEditMode.value = true;
  showAddOrderModal.value = true;
}

async function onOrderFormSaved() {
  await fetchAllData();
  try { deriveCopiedFlagsFromOrders(orders.value || []); } catch {}
  if (isEditMode.value && selectedOrder.value) {
    const updated = (orders.value || []).find(o => o._id === selectedOrder.value._id);
    if (updated) selectedOrder.value = updated;
  }
  if (pendingCopySourceId.value) {
    copiedToNextMonth[pendingCopySourceId.value] = true;
    pendingCopySourceId.value = null;
    saveCopiedFlags();
  }
  closeAddOrderModal();
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

// Goals not yet assigned to any agent (available to give out when removing from others)
const getRemainingGoals = (order) => {
  const total = Number(order?.monthlyGoal ?? order?.totalQuantity ?? 0) || 0
  const distributed = getDistributedGoals(order)
  return Math.max(0, total - distributed)
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

function isOrderOnHold(order) {
  return isOrderOnHoldForMonth(order, currentMonthKey.value)
}

async function updateOrderStatus(order, newStatus) {
  const id = order?._id ?? order?.id
  const monthKey = currentMonthKey.value
  if (!id || !newStatus || !monthKey) return
  const normalized = normalizeOrderStatus(newStatus)
  if (!ORDER_STATUS_OPTIONS.includes(normalized)) return
  if (getOrderStatusForMonth(order, monthKey) === normalized) return

  statusUpdatingId.value = String(id)
  try {
    const payload = buildMonthlyOrderStatusUpdate(order, monthKey, normalized)
    await axios.put(`${urls.backEndURL}/orders/${id}`, payload)
    await store.dispatch('fetchOrders', true)
    if (selectedOrder.value && String(selectedOrder.value._id) === String(id)) {
      selectedOrder.value = {
        ...selectedOrder.value,
        monthlyOrderStatus: payload.monthlyOrderStatus,
      }
    }
  } catch (err) {
    console.error('Failed to update order status:', err?.response?.data || err?.message || err)
  } finally {
    statusUpdatingId.value = null
  }
}

function getMonthlyRevenueGoal(order, month) {
  const goals = order?.monthlyRevenueGoals || {}
  const raw = goals[month.monthKey]
  return Number(raw) || 0
}

function getMonthlyPercentageToGoal(order, month) {
  const goal = getMonthlyRevenueGoal(order, month)
  if (!goal) return 0
  const revenue = Number(month?.revenue) || 0
  const pct = (revenue / goal) * 100
  if (!isFinite(pct) || isNaN(pct)) return 0
  return Math.round(pct)
}

function getMonthlyPercentageToGoalClass(order, month) {
  return getPercentageToGoalBadgeClass(getMonthlyPercentageToGoal(order, month))
}

function getDisplayGoal(order) {
  const fromOrder = order?.campaignGoal ?? order?.campaign_goal
  if (fromOrder != null && fromOrder !== '') {
    const n = Number(fromOrder)
    if (n > 0) return n
  }
  const caseId = order?.caseId?._id ?? order?.caseId?.id ?? order?.caseId
  if (caseId && cases.value?.length) {
    const c = cases.value.find(x => String(x._id ?? x.id) === String(caseId))
    const fromCase = c?.campaignGoal ?? c?.campaign_goal
    if (fromCase != null && fromCase !== '') {
      const n = Number(fromCase)
      if (n > 0) return n
    }
  }
  return Number(order?.monthlyGoal ?? order?.totalQuantity) || 0
}

/** Sum quantityCompleted for calendar months strictly before beforeMonthKey (YYYY-MM). */
function getCompletedQuantityBeforeMonth(order, beforeMonthKey) {
  if (!order || !beforeMonthKey || String(beforeMonthKey).length < 7) return 0
  const logs = Array.isArray(dailyLogs.value) ? dailyLogs.value : []
  let breakdown = order.monthlyBreakdown
  if (!breakdown?.length) {
    breakdown = calculateMonthlyProgress(order, logs)
  }
  if (!breakdown?.length) return 0
  const prefix = String(beforeMonthKey).slice(0, 7)
  return breakdown.reduce((sum, m) => {
    if (String(m.monthKey) < prefix) {
      return sum + (Number(m.quantityCompleted) || 0)
    }
    return sum
  }, 0)
}

/** Remaining campaign units for a copy whose new segment starts at nextRangeStartDateStr (YYYY-MM-DD). */
function getRemainingCampaignGoalForCopy(order, nextRangeStartDateStr) {
  const base = Number(getDisplayGoal(order)) || 0
  const mk = String(nextRangeStartDateStr || '').split('T')[0].slice(0, 7)
  if (!mk || mk.length < 7) return roundTo2Decimals(base)
  const prior = getCompletedQuantityBeforeMonth(order, mk)
  return roundTo2Decimals(Math.max(0, base - prior))
}

function completedUnitsForOrderInDateRange(order, logs, dateRange) {
  if (!order || !Array.isArray(logs) || !dateRange || dateRange.length < 2) return 0
  const from = new Date(dateRange[0])
  const to = new Date(dateRange[1])
  to.setHours(23, 59, 59, 999)
  const oid = String(order._id ?? order.id ?? '')
  return logs.reduce((sum, log) => {
    const logOid = String(log.order?._id ?? log.order ?? log.orderId ?? '')
    const logCase = log.caseName ?? ''
    const sameOrder =
      (oid && logOid === oid) ||
      !!(order.caseName && logCase && String(logCase) === String(order.caseName))
    if (!sameOrder) return sum
    const d = new Date(log.date)
    if (d < from || d > to) return sum
    return sum + (Number(log.quantityCompleted) || 0)
  }, 0)
}

function getTotalQuantity(monthlyBreakdown) {
  if (!monthlyBreakdown || !Array.isArray(monthlyBreakdown)) return 0
  return monthlyBreakdown.reduce((sum, m) => sum + (m.quantityCompleted || 0), 0)
}

function getTotalRevenue(monthlyBreakdown) {
  if (!monthlyBreakdown || !Array.isArray(monthlyBreakdown)) return 0
  return monthlyBreakdown.reduce((sum, m) => sum + (m.revenue || 0), 0)
}

function getTotalCompletedUpToMonth(monthlyBreakdown, upToMonthKey) {
  if (!monthlyBreakdown || !Array.isArray(monthlyBreakdown)) return 0
  let total = 0
  for (const m of monthlyBreakdown) {
    if (m.monthKey <= upToMonthKey) {
      total += (m.quantityCompleted || 0)
    }
  }
  return total
}

function getCampaignGoalDisplay(order) {
  const logs = dailyLogs.value || []
  const range = currentDateRange.value

  let current = 0
  if (Array.isArray(order.monthlyBreakdown) && order.monthlyBreakdown.length) {
    current = order.monthlyBreakdown.reduce(
      (sum, m) => sum + (Number(m.quantityCompleted) || 0),
      0
    )
  } else {
    const progress = calculateMonthlyProgress(order, logs)
    if (progress.length) {
      current = progress.reduce((sum, m) => sum + (Number(m.quantityCompleted) || 0), 0)
    } else {
      current = completedUnitsForOrderInDateRange(order, logs, range)
    }
  }

  const campaignGoal = getDisplayGoal(order)
  return `${current}/${campaignGoal}`
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

    // full-month window for the currently selected month in the toolbar (fallback to order start)
    const baseDate = (currentDateRange.value && currentDateRange.value[0]) || item.startDate;
    const { from, to } = monthBoundsFrom(baseDate);

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

    // Determine this month key (YYYY-MM) for monthly revenue goals
    const baseDateStr = toDateOnly(baseDate) || ''
    const currentMonthKey = baseDateStr ? baseDateStr.slice(0, 7) : ''
    const monthlyGoals = selectedOrder.value.monthlyRevenueGoals || {}
    const caseMonthlyGoalRevenue = Number(monthlyGoals[currentMonthKey]) || 0

    const goalOrderId = orderId
    const goalCaseName = selectedOrder.value.caseName || selectedOrder.value.case?.name || ''

    // build agentSummary only for agents on this order
    const summaries = assignedIds.map(agentId => {
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

      // prefer the order entry from bucket.orders if present
      const orderEntry = bucket?.orders?.find(o => String(o.orderId) === orderId);

      // Revenue for this order/month (if provided), otherwise 0
      const rawRevenue = Number(orderEntry?.revenue);
      const hasRealRevenue = Number.isFinite(rawRevenue) && !Number.isNaN(rawRevenue);
      const revenueForThisOrder = hasRealRevenue ? rawRevenue : 0;

      // Completed units: compute from dailyLogs for the current month + order + agent
      let completedUnitsForThisOrderInt = 0;
      try {
        const logs = Array.isArray(dailyLogs.value) ? dailyLogs.value : [];
        const fromTime = from.getTime();
        const toTime = to.getTime();
        completedUnitsForThisOrderInt = logs
          .filter(l => {
            const logAgentId = String(
              l?.agent?._id ??
              l?.agentId ??
              l?.agent ??
              ''
            );
            if (logAgentId !== String(agentId)) return false;

            const logOrderId = String(
              l?.order?._id ??
              l?.order?.id ??
              l?.orderId ??
              ''
            );
            const logCaseName = l?.caseName ?? ''
            const sameOrder =
              (goalOrderId && logOrderId && logOrderId === goalOrderId) ||
              (goalCaseName && logCaseName && logCaseName === goalCaseName)
            if (!sameOrder) return false;

            const d = new Date(l.date);
            const tMs = d.getTime();
            if (!Number.isFinite(tMs)) return false;
            return tMs >= fromTime && tMs <= toTime;
          })
          .reduce((sum, l) => {
            const units = Number(l.quantityCompleted ?? l.completedUnits ?? 0);
            return sum + (Number.isFinite(units) && !Number.isNaN(units) ? units : 0);
          }, 0);
      } catch (e) {
        console.warn('Failed to compute completed units for agent/order in AssignGoals:', e);
        completedUnitsForThisOrderInt = 0;
      }

      return {
        AgentOrders: AgentOrders,
        id: agentId,
        name,
        goalForThisOrder,
        rateForThisOrder,
        revenueForThisOrder,
        revenueForThisOrderFormatted: currency(revenueForThisOrder),
        completedUnitsForThisOrder: completedUnitsForThisOrderInt,

        // optional: include month totals from the stats bucket
        monthRevenue: Number(bucket?.totals?.revenue ?? bucket?.totalRevenue) || 0,
        monthOrders:  Number(bucket?.totals?.orders)  || (bucket?.orders?.length ?? 0),
      };
    });

    // compute total goal units on this order to apportion monthly revenue goal
    const totalGoalUnits = summaries.reduce((sum, a) => sum + (Number(a.goalForThisOrder) || 0), 0)

    // attach per‑agent monthly revenue goal share (for current month)
    selectedOrder.value.agentSummary = summaries.map(a => {
      let monthlyGoalRevenueForThisMonth = 0
      if (caseMonthlyGoalRevenue && totalGoalUnits) {
        monthlyGoalRevenueForThisMonth =
          caseMonthlyGoalRevenue * ((Number(a.goalForThisOrder) || 0) / totalGoalUnits)
      }
      return {
        ...a,
        monthlyGoalRevenueForThisMonth,
        monthlyGoalRevenueForThisMonthFormatted: currency(monthlyGoalRevenueForThisMonth),
      }
    })

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
    const summary = selectedOrder.value.agentSummary || [];
    const updatedOrder = {
      ...selectedOrder.value,
      agentGoals: Object.fromEntries(summary.map(a => [a.id, Number(a.goalForThisOrder) || 0])),
      agentRates: Object.fromEntries(summary.map(a => [a.id, Number(a.rateForThisOrder) || 0])),
      agentPrices: Object.fromEntries(summary.map(a => [a.id, Number(a.rateForThisOrder) || 0])),
      agentAssignments: summary.map(a => ({
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
    nickname: '',
    contactInfo: {
      contactName: '',
      contactTitle: '',
      email: ''
    }
  };
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
      nickname: gcCase.value.nickname || '',
      contactInfo: gcCase.value.contactInfo
    })
    console.log('Case added:', response.data)
    await store.dispatch('fetchGcCases', true)
    // reset form
    resetCaseForm()
    closeAddCaseModal();
  } catch (err) {
    console.error(err)
    console.log('Failed in adding case.', err)
  }
}


async function loadMonthWeeks() {
  try {
    if (!currentDateRange.value || currentDateRange.value.length < 2) return
    const [startDate] = currentDateRange.value
    const d = new Date(startDate)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    monthWeeks.value = await getMonthWeeks(year, month)
  } catch (e) {
    monthWeeks.value = []
  }
}

onMounted(async () => {

  await fetchAllData()
  try { await store.dispatch('fetchCaseTypes') } catch {}
  console.log('orders:', orders.value);

  loadCopiedFlags();
  // derive historical copied flags so past copies show up (e.g., Oct -> Nov)
  try { deriveCopiedFlagsFromOrders(orders.value || []); } catch {}

  await loadMonthWeeks()

  if (!currentDateRange.value || currentDateRange.value.length < 2) {
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

watch(currentDateRange, loadMonthWeeks, { deep: true })

</script>
<style>
  .assign-goals .assign-goals-orders-table :deep(table) {
    border-collapse: collapse;
  }
  .assign-goals .assign-goals-orders-table.mobile-scroll {
    overflow: visible;
  }
  .assign-goals .assign-goals-orders-table :deep(.v-table__wrapper) {
    max-height: calc(100vh - 280px);
    overflow: auto;
  }
  .assign-goals .assign-goals-orders-table :deep(thead th) {
    position: sticky;
    top: 0;
    z-index: 4;
    background: rgb(var(--v-theme-surface));
    box-shadow: inset 0 -1px 0 rgba(var(--v-border-color), var(--v-border-opacity));
  }
  /* Solid row backgrounds — apply to every td in the case group */
  .assign-goals .assign-goals-orders-table :deep(tr.case-order-status-row[data-case-stripe="1"] > td),
  .assign-goals .assign-goals-orders-table :deep(tr.v-data-table__tr:has(+ tr.case-order-status-row[data-case-stripe="1"]) > td),
  .assign-goals .assign-goals-orders-table :deep(tbody > tr.v-data-table__tr:nth-child(4n+3) > td) {
    background-color: #f5f5f5 !important;
  }
  .assign-goals .assign-goals-orders-table :deep(tr.case-order-status-row.selected-row > td),
  .assign-goals .assign-goals-orders-table :deep(tr.v-data-table__tr:has(+ tr.case-order-status-row.selected-row) > td) {
    background-color: #e0f7fa !important;
  }
  .assign-goals .assign-goals-orders-table :deep(tr.case-order-status-row[data-case-stripe="1"] + tr.monthly-breakdown-row > td) {
    background-color: #f5f5f5 !important;
  }
  .assign-goals .assign-goals-orders-table :deep(tr.case-order-status-row.selected-row + tr.monthly-breakdown-row > td) {
    background-color: #e0f7fa !important;
  }
  .assign-goals .case-cell-block {
    min-width: 0;
    padding-top: 2px;
    padding-bottom: 2px;
  }
  .assign-goals .case-cell-block__header {
    margin-bottom: 0;
  }
  .assign-goals .case-cell-block__status {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    gap: 4px 8px;
    overflow-x: auto;
  }
  .assign-goals .order-status-label {
    flex: 0 0 auto;
    white-space: nowrap;
  }
  .assign-goals .assign-goals-orders-table :deep(tr.v-data-table__tr:has(+ tr.case-order-status-row) td) {
    vertical-align: top;
    padding-top: 10px !important;
  }
  .assign-goals .assign-goals-orders-table :deep(tr.v-data-table__tr:has(+ tr.case-order-status-row) td) {
    border-bottom: none !important;
    padding-bottom: 6px !important;
  }
  .assign-goals .assign-goals-orders-table :deep(tr.case-order-status-row td) {
    vertical-align: middle;
    padding-top: 0 !important;
    padding-bottom: 10px !important;
    border-top: none !important;
  }
  .assign-goals .case-order-status-row__body {
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    padding-top: 4px !important;
    padding-left: 16px !important;
  }
  .assign-goals .assign-goals-orders-table :deep(tr.case-order-status-row:has(+ tr.monthly-breakdown-row) td) {
    border-bottom: none !important;
  }
  .assign-goals .monthly-breakdown-row__expand,
  .assign-goals .monthly-breakdown-row__select {
    width: 0;
    padding: 0 !important;
  }
  .assign-goals .monthly-breakdown-row__body {
    border-top: none !important;
  }
  .assign-goals .order-status-radios-row {
    flex-wrap: nowrap;
    justify-content: flex-start;
    gap: 2px 6px;
    font-size: 0.75rem !important;
    line-height: 1.25 !important;
  }
  .assign-goals .order-status-radios {
    margin: 0;
    flex: 0 0 auto;
    width: auto;
    max-width: none;
  }
  .assign-goals .order-status-radios :deep(.v-input),
  .assign-goals .order-status-radios :deep(.v-input__control),
  .assign-goals .order-status-radios :deep(.v-input__details) {
    width: auto;
    max-width: none;
  }
  .assign-goals .order-status-radios :deep(.v-selection-control-group--inline),
  .assign-goals .order-status-radios :deep(.v-selection-control-group) {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap !important;
    align-items: center;
    gap: 0 10px;
  }
  .assign-goals .order-status-radios :deep(.v-selection-control) {
    flex: 0 0 auto;
    min-height: 1.25rem !important;
    height: 1.25rem !important;
    margin-inline-end: 0 !important;
    align-items: center;
    --v-selection-control-size: 0.75rem;
  }
  .assign-goals .order-status-radios :deep(.v-selection-control__wrapper) {
    width: 0.75rem !important;
    height: 0.75rem !important;
  }
  .assign-goals .order-status-radios :deep(.v-selection-control__input) {
    width: 0.75rem !important;
    height: 0.75rem !important;
    transform: none !important;
  }
  .assign-goals .order-status-radios :deep(.v-selection-control__input .v-icon),
  .assign-goals .order-status-radios :deep(.v-icon) {
    font-size: 0.75rem !important;
    width: 0.75rem !important;
    height: 0.75rem !important;
  }
  .assign-goals .order-status-radios :deep(.v-label),
  .assign-goals .order-status-radios :deep(.v-label .text-caption) {
    font-size: 0.75rem !important;
    line-height: 1.25 !important;
    white-space: nowrap;
    opacity: var(--v-medium-emphasis-opacity, 0.6) !important;
    color: inherit !important;
  }
  /* Mobile styles for Assign Goals */
  .assign-goals .responsive-toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
  .assign-goals .mobile-scroll:not(.assign-goals-orders-table) {
    overflow-x: auto;
  }
  @media (max-width: 600px) {
    .assign-goals {
      width: 100% !important;
      padding: 0 8px;
    }
  }
</style>