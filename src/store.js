import { createStore } from 'vuex'
import axios from 'axios'

const CACHE_TIMEOUT = 10 * 60 * 1000 // 10 minutes

const store = createStore({
  state: {
    user: null,
    agents: [],
    agentStats: [],
    cases: [],
    currentPage: '',
    dateRange: [],
    lastFetch: {
      agents: null,
      agentStats: null,
      cases: null
    }
  },
  
  getters: {
    enrichedAgents(state) {
      return state.agents.map(agent => {
        const stats = state.agentStats.find(stat => stat.name === agent.name)
        return { ...agent, ...stats }
      })
    },
    user: state => state.user,
    cases: state => state.cases,
    agents: state => state.agents,
    agentStats: state => state.agentStats,
    currentPage: state => state.currentPage,
    currentDateRange: state => state.dateRange,
  },

  actions: {
    async fetchAllData({ dispatch }) {
      console.log('🌍 Fetching all data in one request')
      await Promise.all([
        dispatch('fetchAgents'),
        dispatch('fetchAgentStats'),
        dispatch('fetchCases')
      ])
      console.log('✅ All data fetched')
    },
    
    async fetchAgents({ state, commit }) {
      if (state.agents.length && (Date.now() - state.lastFetch.agents < CACHE_TIMEOUT)) {
        console.log('✅ Using cached agents (data is fresh)')
        return
      }
      try {
        console.log('🌍 Fetching agents from API')
        const response = await axios.get(`https://goodcall.fi/api/v1/agent?t=${Date.now()}`)
        commit('setAgents', response.data)
        commit('setLastFetch', { key: 'agents', time: Date.now() })
      } catch (error) {
        console.error('❌ Error fetching agents:', error)
      }
    },
    
    async fetchAgentStats({ state, commit }) {
      if (state.agentStats.length && (Date.now() - state.lastFetch.agentStats < CACHE_TIMEOUT)) {
        console.log('✅ Using cached agent stats (data is fresh)')
        return
      }
      try {
        console.log('🌍 Fetching agent stats from API')
        const response = await axios.get(`https://goodcall.fi/api/v1/agentStats?t=${Date.now()}`)
        commit('setAgentStats', response.data)
        commit('setLastFetch', { key: 'agentStats', time: Date.now() })
      } catch (error) {
        console.error('❌ Error fetching agent stats:', error)
      }
    },
    
    async fetchCases({ state, commit }) {
      if (state.cases.length && (Date.now() - state.lastFetch.cases < CACHE_TIMEOUT)) {
        console.log('✅ Using cached cases (data is fresh)')
        return
      }
      try {
        console.log('🌍 Fetching cases from API')
        const response = await axios.get(`https://goodcall.fi/api/v1/cases?t=${Date.now()}`)
        commit('setCases', response.data)
        commit('setLastFetch', { key: 'cases', time: Date.now() })
      } catch (error) {
        console.error('❌ Error fetching cases:', error)
      }
    },
    
    async fetchCurrentDateRange({ commit }) {
      const currentDate = new Date()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(currentDate.getDate() - 7)
  
      const selectedDateRange = [
        sevenDaysAgo.toISOString().split('T')[0], // Format as YYYY-MM-DD
        currentDate.toISOString().split('T')[0],
      ]
  
      commit('setDateRange', selectedDateRange)
      return selectedDateRange
    },
    
    async fetchUser({ state, commit }) {
      const BASE_URL =
        window.location.hostname === "localhost"
          ? "http://localhost:3030/api/v1/auth/me"
          : "https://goodcall.fi/api/v1/auth/me";

      if (state.user) {
        console.log('✅ Using cached user data from state')
        return
      }
    
      try {
        console.log('🌍 Fetching user from API')
        const response = await axios.get(BASE_URL, {
          withCredentials: true
        })

        console.log('✅ User data fetched successfully', response.data)
        if (response.data) {
          
          commit('SET_USER', response.data)
        }
      } catch (error) {
        console.error('❌ Error fetching user:', error)
      }
    },

    loadUserFromStorage({ commit }) {
      const user = localStorage.getItem('user')
      if (user) {
        commit('SET_USER', JSON.parse(user))
      }
    }
  },

  mutations: {
    setLastFetch(state, { key, time }) {
      state.lastFetch[key] = time
    },
    setAgents(state, agents) {
      state.agents = agents
    },
    setAgentStats(state, agentStats) {
      state.agentStats = agentStats
    },
    setCases(state, cases) {
      state.cases = cases
    },
    setCurrentPage(state, currentPage) {
      state.currentPage = currentPage
    },
    setDateRange(state, range) {
      state.dateRange = range
    },
    SET_USER(state, user) {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    LOGOUT(state) {
      state.user = null
      localStorage.removeItem('user')
    }
  },
})

export default store
