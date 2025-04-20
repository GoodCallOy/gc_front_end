<template>
    <div class="d-flex flex-column align-center" style="height: 100vh;">
      <h1 class="mb-3 mt-5">{{ $t('dashboard.title') }}</h1>
      <!-- List of Cases -->
      <p>{{ $t('dashboard.cases') }}.</p>
     
        <div class="grid-container">
            <DashboardCard01
            v-for="(singleCase, index) in cases"
            :key="index"
            :companyCase="singleCase"
            :agents="agents"
            :currentPage="'dashboard'"
            :dateRange="selectedDateRange"
            />
        </div>
    </div>
  </template>
  
  <script>

    import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';
    import DashboardCard01 from '../partials/dashboard/caseCard.vue'
  
     export default {
        name: 'DashBoard',
        components: {
        // AgentCard, 
        //   CaseCard,  
        DashboardCard01
    },
  
    data() {
      const currentDate = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(currentDate.getDate() - 7);
  
      return {
        selectedDateRange: [
          sevenDaysAgo.toISOString().split('T')[0],
          currentDate.toISOString().split('T')[0],
        ],
      };
    },
  
    computed: {
      ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats']),
      ...mapState(['currentPage']),
  
      user() {
        return this.$store.state.user;
      },
  
      casesGrouped() {
        const casesMap = {};
        this.agentStats.forEach(agent => {
          if (Array.isArray(agent.cases)) {
            agent.cases.forEach(caseItem => {
              if (!casesMap[caseItem]) {
                casesMap[caseItem] = [];
              }
              casesMap[caseItem].push(agent);
            });
          }
        });
        return Object.entries(casesMap).map(([caseName, agents]) => ({ caseName, agents }));
      },
    },
  
    async mounted() {
      this.fetchAgents();
      this.fetchCases();
      this.updatePage('DashBoard');
      this.printDebug();
      await this.fetchAgentStats();
      console.log('🟠 onMounted: Checking user in Vuex:', this.$store.state.user);
      if (!this.$store.state.user) {
        this.$store.dispatch('loadUserFromStorage');
        await this.fetchUserData();
      }
    },
  
    methods: {
      ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']),
      ...mapMutations(['setCurrentPage']),
      
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

  .grid-scroll-wrapper {
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
  }
  
  .grid-container {
    display: flex;
    gap: 16px; /* space between items */
    overflow-x: auto;
    overflow-y: hidden;
    padding: 1rem; /* optional padding */
    scroll-behavior: smooth; /* optional smooth scroll */
    width: 80vw; /* adjust as needed */

    /* Hide scrollbar for Webkit browsers (Chrome, Safari) */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
  }

  .grid-container::-webkit-scrollbar {
    display: none; /* Chrome, Safari, and Opera */
  }
  </style>
  