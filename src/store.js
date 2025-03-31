import { createStore } from 'vuex';
import axios from 'axios';

const store = createStore({
  state: {
    user: null,
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

    user: state => state.user,

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
        const response = await axios.get(`https://goodcall.fi/api/v1/agent/?t=${new Date().getTime()}`);
        commit('setAgents', response.data);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    },
    async fetchAgentStats({ commit }) {
      try {
        const response = await axios.get('https://goodcall.fi/api/v1/agentStats/?t=${new Date().getTime()}');
        commit('setAgentStats', response.data);
      } catch (error) {
        console.error('Error fetching agent stats:', error);
      }
    },
    async fetchCases({ commit }) {
      try {
        const response = await axios.get('https://goodcall.fi/api/v1/cases/?t=${new Date().getTime()}');
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
    
    async fetchUser({ commit }) {
      try {
        const response = await axios.get('https://goodcall.fi/api/v1/auth/me', {
          withCredentials: true // Ensure cookies are sent
        });
        console.log('🟢 Fetched user data in store:', response.data); // Log the response
        if (response.data) {
          commit('SET_USER', response.data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    },
    loadUserFromStorage({ commit }) {
      const user = localStorage.getItem('user');
      if (user) {
        commit('SET_USER', JSON.parse(user));
      }
    }
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
    SET_USER(state, user) {
      state.user = user; // Store entire user object
      localStorage.setItem('user', JSON.stringify(user)); // Persist in storage
    },
    LOGOUT(state) {
      state.user = null;
      localStorage.removeItem('user');
    }
  
  },
});

export default store;
