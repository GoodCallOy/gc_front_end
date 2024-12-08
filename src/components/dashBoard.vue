<template>
  <div class="d-flex flex-column align-center" style="height: 100vh;">
    <h1 class="mb-3 mt-5">The Dashboard</h1>

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
            <v-btn text color="primary" @click="menu1 = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>

      <!-- Second Button: Month Picker Only -->
      <v-menu v-model="menu2" persistent>
        <template v-slot:activator="{ props }">
          <v-btn color="primary" v-bind="props" class="mx-3">
            {{ displayMonth }}
          </v-btn>
        </template>
        <v-card>
          <v-date-picker v-model="selectedMonth" color="primary" type="month" @input="menu2 = false" />
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text color="primary" @click="menu2 = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>

      <!-- Third Button: Week Picker -->
      <v-menu v-model="menu3" persistent>
        <template v-slot:activator="{ props }">
          <v-btn color="primary" v-bind="props" class="mx-3">
            {{ displayWeek }}
          </v-btn>
        </template>
        <v-card>
          <v-date-picker v-model="selectedWeekDate" color="primary" type="date" @input="menu3 = false" />
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text color="primary" @click="menu3 = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>
    </div>

    <!-- List of Cases -->
    <p>List of cases.</p>
    <div class="d-flex flex-wrap justify-center mb-5">
      <CaseCard
        v-for="(singleCase, index) in cases"
        :key="index"
        :companyCase="singleCase"
        :agents="agents"
      />
    </div>

    <!-- List of Agents -->
    <p class="mt-5">List of agents.</p>
    <div class="d-flex flex-wrap justify-center">
      <AgentCard
        v-for="(agent, index) in agents"
        :key="index"
        :agent="agent"
      />
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import AgentCard from './agentCard.vue'
import CaseCard from './caseCard.vue'

export default {
  name: 'dashBoard',

  components: {
    AgentCard, // Register the component
    CaseCard,  // Register the component
  },

  data() {
    return {
      agents: [],          // Array to store agents data
      cases: [],           // Array to store cases data
      menu1: false,        // Controls the first menu (Date)
      menu2: false,        // Controls the second menu (Month)
      menu3: false,        // Controls the third menu (Week)
      selectedDate: new Date(), // Current selected date
      selectedMonth: new Date(), // Month selection model
      selectedWeekDate: new Date(), // Week selection model
    };
  },

  computed: {
    displayDate() {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      const formattedDate = this.selectedDate.toLocaleDateString(undefined, options);
      return `${formattedDate}`;
    },

    displayMonth() {
      const options = { year: 'numeric', month: 'short' };
      return this.selectedMonth.toLocaleDateString(undefined, options);
    },

    displayWeek() {
      const weekNumber = this.getWeekNumber(this.selectedWeekDate);
      return `Week ${weekNumber} (${this.selectedWeekDate.getFullYear()})`;
    }
  },

  mounted() {
    // Fetch the list of agents when the component is mounted
    this.getAgents();
    this.getCases();
  },

  methods: {
    async getAgents() {
      try {
        const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/agent/');
        this.agents = response.data; // Store the fetched data in the agents array
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    },

    async getCases() {
      try {
        const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/cases/');
        this.cases = response.data; // Store the fetched data in the cases array
      } catch (error) {
        console.error('Error fetching cases:', error);
      }
    },

    getWeekNumber(date) {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + 1) / 7);
      return weekNumber;
    }
  }
};
</script>

<style scoped>
.v-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.date-picker-btn {
  text-transform: none; /* Avoids button text being uppercase */
  min-width: 200px;
}
</style>
