<template>
  <v-card
    :class="['mx-2 my-2', { 'full-width-card': currentPage === 'singleCase' }]"
    :style="cardStyles"
    :elevation="currentPage === 'singleCase' ? 0 : 16"
  >
    <!-- Centered Case Information -->
    <div v-if="currentPage === 'dashBoard'" class="text-center">
      <v-card-title class="text-h5">{{ companyCase.name }}</v-card-title>
      
      <!-- Statistics -->
      <div class="d-flex stats-container">
        <!-- First card -->
        <div class="stats-card">
          <v-card-subtitle></v-card-subtitle>
          <v-card-text class="text-center">
            <p><strong>Total Billing:</strong> {{ companyCase.billing }}</p>
            <p><strong>Total Meetings (Tapaamiset):</strong> {{ caseStats.totalMeetings }}</p>
            <p><strong>Dials / Meeting (Uloslähtenyttä):</strong> {{ caseStats.totalOutgoingCalls }}</p>
            <p><strong>Hour/Meeting (Tunti):</strong> {{ caseStats.totalCallTime }}</p>
          </v-card-text>
        </div>
      </div>
    </div>

    <div class="d-flex flex-row justify-center">
      <div v-if="currentPage !== 'dashBoard'" class="d-flex flex-column justify-center gap-2">
      <v-banner
          class="my-4 custom-banner"
          color="yellow-accent-1"
          icon="mdi-cash-100"
          dense
          max-width="500"
        >
          <v-banner-text class="text-center text-h6 font-weight-black">
            <p ><strong>Total Billing:</strong> {{ companyCase.billing }}</p>  
          </v-banner-text>
      </v-banner>
      <v-banner
        class="my-1 custom-banner"
        color="deep-purple-accent-2"
        icon="mdi-file-star"
        dense
        max-width="500"
      >
        <v-banner-text class="text-center text-h6 font-weight-black">
          <p><strong>Total Meetings (Tapaamiset):</strong> {{ caseStats.totalMeetings }}</p>  
        </v-banner-text>
      </v-banner>
      <v-banner
          class="my-1 custom-banner"
          color="deep-purple-accent-4"
          icon="mdi-phone-dial"
          dense
          max-width="500"
        >
          <v-banner-text class="text-center text-h6 font-weight-black">
            <p><strong>Dials / Meeting (Uloslähtenyttä):</strong> {{ caseStats.totalOutgoingCalls }}</p>  
          </v-banner-text>
      </v-banner>
      <v-banner
          class="my-1 custom-banner"
          color="deep-purple-accent-4"
          icon="mdi-file-chart"
          dense
          max-width="500"
        >
          <v-banner-text class="text-center text-h6 font-weight-black">
            <p><strong>Hour/Meeting (Tunti):</strong> {{ caseStats.totalCallTime }}</p>
          </v-banner-text>
      </v-banner>
    </div>
    <div v-if="currentPage !== 'dashBoard'" class="d-flex flex-column justify-center gap-2">
      <v-banner
          class="my-4 custom-banner"
          color="light-green-accent-1"
          icon="mdi-phone-classic"
          dense
          max-width="500"
        >
          <v-banner-text class="text-center text-h6 font-weight-black">
            <p><strong>Active Call Time (Soittoaika):</strong> {{ caseStats.totalCallTime }} mins</p>  
          </v-banner-text>
        </v-banner>
        <v-banner
          class="my-1 custom-banner"
          color="deep-purple-accent-4"
          icon="mdi-phone-incoming"
          dense
          max-width="500"
        >
          <v-banner-text class="text-center text-h6 font-weight-black">
            <p><strong>Completed Calls Made (Läpiviedyt puhelut):</strong> {{ caseStats.totalCallsMade }}</p>
          </v-banner-text>
        </v-banner>
        <v-banner
            class="my-1 custom-banner"
            color="deep-purple-accent-4"
            icon="mdi-phone-outgoing"
            dense
            max-width="500"
          >
            <v-banner-text class="text-center text-h6 font-weight-black">
              <p><strong>Total Outgoing Calls (Uloslähteneet puhelut):</strong> {{ caseStats.totalOutgoingCalls }}</p>
            </v-banner-text>
        </v-banner>
        <v-banner
            class="my-1 custom-banner"
            color="deep-purple-accent-4"
            icon="mdi-file-phone"
            dense
            max-width="500"
          >
            <v-banner-text class="text-center text-h6 font-weight-black">
              <p><strong>Total Answered Calls (Vastatut puhelut):</strong> {{ caseStats.totalAnsweredCalls }}</p>
            </v-banner-text>
        </v-banner>
      </div>
    </div>
    <div v-if="currentPage !== 'dashBoard'" class="d-flex flex-row justify-center gap-2">

      <v-banner
            class="my-1 custom-banner"
            color="deep-purple-accent-4"
            icon="mdi-circle-multiple"
            dense
            max-width="350"
          >
            <v-banner-text class="text-center text-h6 font-weight-black">
              <p><strong>Average Response Rate (Vastausprosentti):</strong> {{ caseStats.totalResponseRate }}%</p>
            </v-banner-text>
        </v-banner>
    </div>

    <div v-if="currentPage === 'dashBoard'" class="d-flex justify-center">
      <v-btn color="primary" class="mb-5" @click="showCase">
        Show Case
      </v-btn>
    </div>   

    <div class="d-flex flex-column ml-5">
      <!-- Filtered Agent Cards -->
      <v-card-subtitle>
        <strong>Assigned Manager:</strong>
      </v-card-subtitle>
      <v-card-subtitle>
        <strong>Assigned Agents: {{ getAgentNameInCase(companyCase.name) }}</strong>
      </v-card-subtitle>
    </div>
    

    <div class="d-flex flex-wrap justify-center mt-5">
      <AgentCard
        v-for="(agent, index) in filteredAgents"
        :key="index"
        :agent="agent"
        class="m-2"
      />
    </div>

    <div v-if="currentPage !== 'dashBoard'" class="d-flex flex-wrap justify-center">
      <AgentCard
        v-for="(agent, index) in agentsWithStats"
        :key="index"
        :agent="agent"
      />
    </div>
  </v-card>
</template>

<script>
import AgentCard from './agentCard.vue';
import { mapGetters, mapActions, mapState } from 'vuex';
import { toRaw } from 'vue';

export default {
  name: 'CaseCard',
  props: {
    companyCase: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    dateRange:
    {
      type: Object,
      required: true,
      default: () => ({}),
    },
  },
  components: {
    AgentCard,
  },
  data() {
    return {
      agentsWithStats: [],
      caseStats: null,
    };
  },
  computed: {
    ...mapState(['currentPage']),
    ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats','currentDateRange']),
    cardStyles() {
      return this.currentPage === 'singleCase'
        ? { width: '100%', margin: '0' }
        : { width: 'auto', maxWidth: '400px', padding: '20px' };
    },
    filteredAgents() {
      const [startDate, endDate] = this.dateRange || this.currentDateRange;

      if (!startDate || !endDate) {
        console.error('Invalid date range for filtering agents:', this.dateRange);
        return [];
      }

      return this.agents.filter(agent => {
        const activityDate = new Date(agent.lastActivityDate).getTime();
        return (
          agent.case === this.companyCase.name &&
          activityDate >= new Date(startDate).getTime() &&
          activityDate <= new Date(endDate).getTime()
        );
      });
    }
  },
  watch: {
    agentStats: {
      handler() {
        this.updateStats();
      },
      immediate: true,
    },
    dateRange: {
      handler() {
        this.updateStats();
      },
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    this.fetchAgents();
    this.fetchAgentStats();
    this.fetchCases();
    this.updateStats();
    this.fetchCurrentDateRange();
  },
  methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases','fetchCurrentDateRange']),
    getAgentNameInCase() {
      const agentsInCase = this.agents.filter(agent =>
        agent.cases.includes(this.companyCase.name)
      );
      return agentsInCase.map(agent => agent.name).join(', ');
    },
    updateStats() {
      const rawDateRange = toRaw(this.dateRange);
      console.log('Raw dateRange:', rawDateRange);

      if (!Array.isArray(rawDateRange)) {
        console.error('Invalid date range:', rawDateRange);
        return;
      }

      this.agentsWithStats = this.mergeStatsData(this.companyCase.name);
      this.caseStats = this.aggregateStats();

      console.log('Updated Stats:', this.caseStats);
    },
    mergeStatsData(caseName) {
      const rawDateRange = toRaw(this.dateRange || this.currentDateRange);
      const [startDate, endDate] = Array.isArray(rawDateRange)
        ? rawDateRange
        : [rawDateRange.startDate, rawDateRange.endDate];

      const agentsInCase = this.agents.filter(agent =>
        agent.cases.includes(this.companyCase.name)
      );

      return agentsInCase.map(agent => {
        const stats = this.agentStats.find(stat => {
          if (stat.name !== agent.name || stat.case !== caseName) return false;

          const statStart = new Date(stat.calling_date.start).getTime();
          const statEnd = new Date(stat.calling_date.end).getTime();

          // Correct the assignment of CStartdate and CEnddate
          const CStartdate = new Date(startDate).getTime(); // Use startDate as CStartdate
          const CEnddate = new Date(endDate).getTime(); // Use endDate as CEnddate

          // Check if the stat falls within the date range
          return (
            statStart <= CEnddate && // stat starts before or when the range ends
            statEnd >= CStartdate    // stat ends after or when the range starts
          );
        });

        // If no stats found, initialize with zero values
        return {
          ...agent,
          meetings: stats?.meetings || 0,
          call_time: stats?.call_time || 0,
          calls_made: stats?.calls_made || 0,
          outgoing_calls: stats?.outgoing_calls || 0,
          answered_calls: stats?.answered_calls || 0,
          response_rate: stats?.response_rate || 0,
        };
      });
    },
    aggregateStats() {
      return this.agentsWithStats.reduce(
        (totals, agent) => {
          totals.totalMeetings += agent.meetings || 0;
          totals.totalCallTime += agent.call_time || 0;
          totals.totalCallsMade += agent.calls_made || 0;
          totals.totalOutgoingCalls += agent.outgoing_calls || 0;
          totals.totalAnsweredCalls += agent.answered_calls || 0;
          totals.totalResponseRate = ((totals.totalAnsweredCalls || 0) / totals.totalOutgoingCalls * 100 || 0).toFixed(1) || 0;
          return totals;
        },
        {
          totalMeetings: 0,
          totalCallTime: 0,
          totalCallsMade: 0,
          totalOutgoingCalls: 0,
          totalAnsweredCalls: 0,
          totalResponseRate: 0,
        }
      );
    },
    showCase() {
      this.$router.push({
        name: 'singleCase',
        query: { case: this.companyCase.name },
      });
    },
    filteredAgentsByDate(agentArray) {
      if (!this.selectedDateRange || this.selectedDateRange.length !== 2) {
        return [];
      }

      const [startDate, endDate] = this.selectedDateRange.map(date => {
        const parsedDate = new Date(date);
        return isNaN(parsedDate.getTime()) ? null : parsedDate.getTime();
      });

      // Check if startDate or endDate is invalid
      if (startDate === null || endDate === null) {
        console.error('Invalid date range:', this.selectedDateRange);
        return [];
      }

      return agentArray.filter(agent => {
        if (!agent.calling_date || !agent.calling_date.start || !agent.calling_date.end) {
          console.warn(`Incomplete calling_date for agent:`, agent);
          return false;
        }

        const start = new Date(agent.calling_date.start).getTime();
        const end = new Date(agent.calling_date.end).getTime();

        return start <= endDate && end >= startDate;
      });
    },
  },
};
</script>

<style scoped>
.d-flex.flex-wrap {
  gap: 16px;
}

.text-center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
}

.stats-container2 {
  display: flex;
  flex-wrap: wrap;
}

.stats-card,
.stats-card2 {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
  background-color: white;
  padding: 20px;
}

.full-width-card {
  width: 100%;
  margin: 0;
  padding: 20px;
}

/* Remove any borders or box shadows */
.custom-banner {
  border: none !important;
}
</style>
