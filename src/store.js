import { createStore } from 'vuex';
import axios from 'axios';
const store = createStore({
  state: {
    agents: [],
    agentStats: [],
    cases: [],
    currentPage: "",
    dateRange: [],
  },
  getters: {
    enrichedAgents(state) {
      return state.agents.map(agent => {
        const stats = state.agentStats.find(stat => stat.name === agent.name);
        return { ...agent, ...stats };
      });
    },

    cases(state){
      return state.cases
    },
    agents(state){
      return state.agents
    },
    agentStats(state) {
      return state.agentStats
    },
    currentPage(state){
      return state.currentPage
    },
    currentDateRange(state){
      return state.dateRange
    },
  },

  actions: {
    async fetchAgents({ commit }) {
      try {
        const response = await axios.get('https://goodcall.fi/api/v1/agent/');
        commit('setAgents', response.data);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    },
    async fetchAgentStats({ commit }) {
      try {
        const response = await axios.get('https://goodcall.fi/api/v1/agentStats/');
        commit('setAgentStats', response.data);
      } catch (error) {
        console.error('Error fetching agent stats:', error);
      }
    },
    async fetchCases({ commit }) {
      try {
        const response = await axios.get('https://goodcall.fi/api/v1/cases/');
        commit('setCases', response.data);
      } catch (error) {
        console.error('Error fetching agent stats:', error);
      }
    },
    async fetchCurrentDateRange({ commit }) {
      const currentDate = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(currentDate.getDate() - 7);
  
      const selectedDateRange = [
        sevenDaysAgo.toISOString().split('T')[0], // Format as YYYY-MM-DD
        currentDate.toISOString().split('T')[0],
      ];
  
      commit('setDateRange', selectedDateRange);
      return selectedDateRange; // Optional, for immediate usage after dispatch
    },
  },
  mutations: {
    setAgents(state, agents) {
      state.agents = agents;
    },
    setAgentStats(state, agentStats) {
      state.agentStats = agentStats;
    },
    setCases(state, cases) {
      state.cases = cases;
    },
    setCurrentPage(state, currentPage) {
      state.currentPage = currentPage;
    },
    setDateRange(state, range) {
      state.dateRange = range;
    },
  },
});

export default store;
