<template>
    <div class="d-flex flex-column align-center" style="height: 100vh;">
      <h1 class="mb-3 mt-5">{{ this.$route.query.case }}</h1>
  
      <!-- Buttons for selecting Date, Month, and Week -->
      <div class="d-flex flex-row align-center ma-5">
        <!-- First Button: Full Date Picker -->
        <v-menu v-model="menu1" persistent>
          <template v-slot:activator="{ props }">
            <v-btn color="primary" v-bind="props" class="mx-3">
              {{ displayDate }}
            </v-btn>
          </template>
          <v-card>
            <v-date-picker v-model="selectedDate" color="primary" @input="menu1 = false" />
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="menu1 = false">{{ $t('buttons.close') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
  
        <!-- Second Button: Month Selector -->
        <v-menu v-model="menu2" persistent>
          <template v-slot:activator="{ props }">
            <v-btn color="primary" v-bind="props" class="mx-3">
              {{ displayMonth }}
            </v-btn>
          </template>
          <v-card class="small-card">
            <v-container>
              <v-row>
                <!-- Loop to create buttons for each month -->
                <v-col cols="4" v-for="(month, index) in months" :key="index">
                  <v-btn
                    block
                    color="primary"
                    class="small-btn"
                    @click="selectMonth(index)"
                  >
                    {{ month }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-container>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="menu2 = false">{{ $t('buttons.close') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
  
        <!-- Third Button: Week Selector -->
        <v-menu v-model="menu3" persistent>
          <template v-slot:activator="{ props }">
            <v-btn color="primary" v-bind="props" class="mx-3">
              {{ displayWeek }}
            </v-btn>
          </template>
          <v-card class="small-card">
            <v-container>
              <v-row>
                <!-- Loop to create buttons for each week -->
                <v-col cols="3" v-for="(week, index) in weeks" :key="index">
                  <v-btn
                    block
                    color="primary"
                    class="small-btn"
                    @click="selectWeek(index + 1)"
                  >
                    Week {{ index + 1 }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-container>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="menu3 = false">{{ $t('buttons.close') }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </div>

      
      <div class=" justify-center" style="width: 100vw;">
        <CaseCard
          :companyCase="selectedCase"
          :agents="agents"
        />
      </div>
  
      <!-- List of Agents -->
      
    </div>
  </template>
  
  <script>
  import CaseCard from './caseCard.vue';
  import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';
  
  export default {
    name: 'SinglCase',
  
    components: {
      CaseCard,  // Register the component
      
    },
  
    data() {
      return {
        dateRange: 'day',
        menu1: false,        // Controls the first menu (Date)
        menu2: false,        // Controls the second menu (Month)
        menu3: false,        // Controls the third menu (Week)
        selectedDate: new Date(), // Current selected date
        selectedMonth: new Date(), // Month selection model
        selectedWeekDate: new Date(), // Week selection model
        months: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ], // Names of the months
        weeks: Array.from({ length: 52 }, (_, i) => i + 1), // Array of week numbers
      };
    },
    
    computed: {
      ...mapGetters(['enrichedAgents', 'agents', 'cases']), // Map Vuex getter to local computed property
      ...mapState(["currentPage"]),

      currentPage() {
        console.log('currentPage1', this.$store.getters.currentPage)
        return this.$store.getters.currentPage;
      },

      displayDate() {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return this.selectedDate.toLocaleDateString(undefined, options);
      },
  
      displayMonth() {
        const options = { year: 'numeric', month: 'short' };
        return this.selectedMonth.toLocaleDateString(undefined, options);
      },
  
      displayWeek() {
        const weekNumber = this.getWeekNumber(this.selectedWeekDate);
        return `Week ${weekNumber} (${this.selectedWeekDate.getFullYear()})`;
      },

      selectedCase() {
        const caseName = this.$route.query.case; // Get the case name from the query string
        const selected = this.cases.find(singleCase => singleCase.name === caseName); // Find the specific case by name
        return selected;
      },
    },
  
    mounted() {
      this.fetchAgents(); // Fetch agents when the component is mounted
      this.fetchAgentStats(); // Fetch agent stats when the component is mounted
      this.fetchCases();
      this.updatePage('singleCase');

    },
  
    methods: {
      
      ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']), // Map Vuex actions to local methods
      ...mapMutations(["setCurrentPage"]), // Maps mutation to update `currentPage`
      
      updatePage(newPage) {
        this.setCurrentPage(newPage); // Update `currentPage` in the store
      },
  
      getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + 1) / 7);
        return weekNumber;
      },
  
      selectMonth(index) {
        const now = new Date();
        this.selectedMonth = new Date(now.getFullYear(), index, 1); // Set the first day of the selected month
        this.menu2 = false; // Close the menu after selection
      },
  
      selectWeek(weekNumber) {
        const now = new Date();
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        const daysOffset = (weekNumber - 1) * 7;
        this.selectedWeekDate = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);
        this.menu3 = false; // Close the menu after selection
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
  </style>
  