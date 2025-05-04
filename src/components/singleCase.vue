<template>
  <div class="d-flex flex-column align-center" style="height: 100vh;">
    <h1 class="mb-3 mt-5">{{ $route.query.case }}</h1>
    
    <div class="card-container d-flex justify-center pa-0 mb-5" style="width: 80vw;">
      <CaseStatsCard
        :companyCase="selectedCase"
        :agents="agents"
        :dateRange="selectedDateRange"
      />
    </div>

    <v-container fluid class="pa-0 mt-5" style="width: 80vw;">
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
              <BarChart style="height: 400px;" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import CaseStatsCard from './caseStatsCard.vue';
// import MonthButtons from './monthButtons.vue';
import LineChart from '../partials/dashboard/line-chart.vue'
import BarChart from '../partials/dashboard/bar-chart.vue'
import { mapState, mapMutations } from 'vuex';

export default {
  name: 'SingleCase',
  

  components: { 
    CaseStatsCard, 
    // MonthButtons,
    LineChart,
    BarChart,
  },

  data() {
  const currentDate = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(currentDate.getDate() - 7);

  return {
    selectedDateRange: [sevenDaysAgo, currentDate],
  };
},


  computed: {
    ...mapState(['cases', 'agents', 'currentPage']),

    selectedCase() {
      const caseName = this.$route.query.case;
      return this.cases.find(singleCase => singleCase.name === caseName);
    },
  },

  watch: {
  selectedDateRange(newRange) {
    console.log('Date range changed:', newRange);

    const [startDate, endDate] = newRange.map(date => new Date(date));
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date range detected:', newRange);
    } else {
      console.log('Valid date range:', { startDate, endDate });
    }
  },
},

  mounted() {
    this.updatePage('singleCase');
  },

  methods: {
    ...mapMutations(['setCurrentPage']),

    updatePage(newPage) {
      this.setCurrentPage(newPage);
    },
    handleUdatedDateRange(newDateRange) {
      this.selectedDateRange = newDateRange;
    },
  },
};
</script>

<style scoped>
.date-range-picker {
  width: 25vw;
}

.card-container {
  width: 100vw;
}

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
</style>
