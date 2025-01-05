import { createStore } from 'vuex';
import axios from 'axios';
const store = createStore({
  state: {
    agents: [],
    agentStats: [],
    cases: [],
    currentPage: "",
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
    currentPage(state){
        return state.currentPage
    }
  },

  actions: {
    async fetchAgents({ commit }) {
      try {
        const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/agent/');
        commit('setAgents', response.data);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    },
    async fetchAgentStats({ commit }) {
      try {
        const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/agentStats/');
        commit('setAgentStats', response.data);
      } catch (error) {
        console.error('Error fetching agent stats:', error);
      }
    },
    async fetchCases({ commit }) {
      try {
        const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/cases/');
        commit('setCases', response.data);
      } catch (error) {
        console.error('Error fetching agent stats:', error);
      }
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
  },
});

export default store;
