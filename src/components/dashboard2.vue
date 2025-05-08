<template>
    <div class="d-flex flex-column align-center" style="height: 100vh;">  
        <div class="grid-container " >
            <DashboardCard01
            v-for="(singleCase, index) in cases"
            :key="index"
            :companyCase="singleCase"
            :agents="agents"
            :currentPage="'dashboard'"
            :dateRange="selectedDateRange"
            />
        </div>
        <v-container fluid style="width: 90vw; ;">
    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>
            <v-row justify="space-between" class="w-100">
              <div>
                <v-chip color="primary" outlined>● Total Revenue</v-chip>
                <v-chip color="primary lighten-4" outlined class="ml-2">○ Total Sales</v-chip>
                <div class="text-caption mt-1">12.04.2022 - 12.05.2022</div>
              </div>
              <v-btn-toggle dense mandatory>
                <v-btn>Day</v-btn>
                <v-btn>Week</v-btn>
                <v-btn>Month</v-btn>
              </v-btn-toggle>
            </v-row>
          </v-card-title>
          <v-card-text>
            <LineChart style="height: 400px;" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="d-flex justify-space-between">
            <span class="font-weight-medium">Profit this week</span>
            <v-menu>
              <template v-slot:activator="{ on, attrs }">
                <v-btn text v-bind="attrs" v-on="on">This Week ▾</v-btn>
              </template>
              <v-list>
                <v-list-item>Last Week</v-list-item>
                <v-list-item>This Month</v-list-item>
              </v-list>
            </v-menu>
          </v-card-title>
          <v-card-text>
            <BarChart style="height: 400px;"/>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    </v-container>
    </div>
    
</template>
  
  
<script>

    import { mapGetters, mapActions, mapState, mapMutations } from 'vuex'
    import DashboardCard01 from '../partials/dashboard/caseCard.vue'
    import LineChart from '../partials/dashboard/line-chart.vue'
    import BarChart from '../partials/dashboard/bar-chart.vue'
  
     export default {
        name: 'DashBoard',
        components: {
        // AgentCard, 
        //   CaseCard,  
        DashboardCard01,
          LineChart,
          BarChart
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

      const gridContainer = this.$el.querySelector('.grid-container');
      gridContainer.addEventListener('wheel', (event) => {
        event.preventDefault();
        gridContainer.scrollLeft += event.deltaY; // Scroll horizontally
      });
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
  
  .grid-container {
    display: flex;
    gap: 16px; /* space between items */
    overflow-x: auto;
    overflow-y: hidden;
    padding: 1rem; /* optional padding */
    scroll-behavior: smooth; /* optional smooth scroll */
    width: 90vw; /* adjust as needed */
    margin-bottom: 1rem; /* ✅ Add spacing to push down the charts */
    flex-shrink: 0; /* ✅ Prevent it from collapsing or overlapping */

    /* Hide scrollbar for Webkit browsers (Chrome, Safari) */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
  }

  .grid-container::-webkit-scrollbar {
    display: none; /* Chrome, Safari, and Opera */
  }

  /* Enable scrolling when hovering */
  .grid-container:hover {
    overflow-x: auto; /* Ensure scrolling works on hover */
  }
</style>
  