<template>
  <div class="d-flex flex-column align-center" style="height: 100vh;">
    <h1 class="mb-3 mt-5">{{ $t('dashboard.title') }}</h1>


    <div>
      <MonthButtons @childEvent="handleUpdatedDateRange" />
    </div>
    <div>
      <v-card class="mb-5" elevation="1"  rounded="xl" style="max-width: 200px; max-height: 300px; overflow: auto;">
        <div class="d-flex align-center">
        <!-- Previous Button -->
        <v-btn icon flat class="pa-0 ma-0" @click="getPreviousMonth">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>

        <!-- Current Month Label -->
        <div class="text-h6 font-weight-medium mx-3"> {{ this.getFormattedDateRange }}</div>

        <!-- Next Button -->
        <v-btn icon flat @click="getNextMonth" v-if="!getIsCurrentMonth">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
      </v-card>
    </div>

    <!-- List of Cases -->
    <p>{{ $t('dashboard.cases') }}.</p>
    <div class="grid-container">
      <CaseCard
        v-for="(singleCase, index) in cases"
        :key="index"
        :companyCase="singleCase"
        :agents="agents"
        :currentPage="'dashboard'"
        :dateRange="selectedDateRange"
      />
    </div>

    <!-- List of Agents
    <p class="mt-5">{{ $t('dashboard.agents') }}</p>
    <div class="d-flex flex-wrap justify-center">
      <AgentCard
        v-for="(agent, index) in enrichedAgents"
        :key="index"
        :agent="agent"
      />
    </div> -->
  </div>
</template>

<script>
// import AgentCard from './agentCard.vue';
import CaseCard from './cases/caseCard.vue';
import MonthButtons from './monthButtons.vue';    
import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth } from '@/js/dateUtils';


export default {
  name: 'DashBoard',
  components: {
    // AgentCard, 
    CaseCard,  
    MonthButtons,
  },

  data() {
    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    return {
      selectedDateRange: [
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0],
      ],
    };
  },

  computed: {
    ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats', 'currentDateRange']),
    ...mapState(['currentPage']),

    user() {
      return this.$store.state.user;
    },
    getFormattedDateRange() {
      return formattedDateRange(this.currentDateRange);
      },
      getIsCurrentMonth() {
      return isCurrentMonth(this.currentDateRange)
    },
  },

  async mounted() {
    await this.fetchAllData(); // Fetch all required data when the component is mounted
    this.updatePage('DashBoard');

     // Set the date range to the current month
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    startOfMonth.setDate(startOfMonth.getDate() + 3);

    const currentMonthRange = [
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0],
    ];

    this.updateDateRange(currentMonthRange); // Update the date range

    this.printDebug();
  },

  methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']),
    ...mapMutations(['setCurrentPage']),
    
    async fetchAllData() {
      // Check if data is already cached and valid
      const now = Date.now();
      const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

      if (!this.$store.state.lastFetch.agents || now - this.$store.state.lastFetch.agents > CACHE_TIMEOUT) {
        console.log('🌍 Fetching agents from API');
        await this.fetchAgents();
      } else {
        console.log('✅ Using cached agents');
      }

      if (!this.$store.state.lastFetch.cases || now - this.$store.state.lastFetch.cases > CACHE_TIMEOUT) {
        console.log('🌍 Fetching cases from API');
        await this.fetchCases();
      } else {
        console.log('✅ Using cached cases');
      }

      if (!this.$store.state.lastFetch.agentStats || now - this.$store.state.lastFetch.agentStats > CACHE_TIMEOUT) {
        console.log('🌍 Fetching agent stats from API');
        await this.fetchAgentStats();
      } else {
        console.log('✅ Using cached agent stats');
      }

    },

    getPreviousMonth() {
      const prevMonth = goToPreviousMonth(this.currentDateRange);
      this.updateDateRange(prevMonth);
    },
    getNextMonth() {
      const nextMonth = goToNextMonth(this.currentDateRange);
      this.updateDateRange(nextMonth);
    },
    updateDateRange(newRange) {
      this.$store.commit('setDateRange', newRange); // Use the correct mutation name
      this.handleUpdatedDateRange(newRange);
    },
    
    updatePage(newPage) {
      this.setCurrentPage(newPage);
    },
    
    async fetchUserData() {
      await this.$store.dispatch('fetchUser');
    },
    
    handleUpdatedDateRange(newRange) {
      this.selectedDateRange = newRange;
    },
    
    printDebug() {
     
      console.log('🔍 Current Page:', this.currentPage);
      console.log('🔍 User in dashboard:', this.$store.state.user);
    },
  },
};
</script>

<style scoped>
.small-card {
  max-width: 450px;
  max-height: 300px;
  overflow: auto;
}

.small-btn {
  font-size: 12px;
  padding: 4px 8px;
  min-width: 85px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
</style>
