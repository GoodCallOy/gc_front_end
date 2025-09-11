import { createStore } from 'vuex'
import axios from 'axios'
import urls from './js/config.js'

const CACHE_TIMEOUT = 10 * 60 * 1000 // 10 minutes

const store = createStore({
  state: {
    user: null,
    users: [],
    agents: [],
    agentStats: [],
    cases: [],
    GcCases: [],
    orders: [],
    gcAgents: [],
    dailyLogs: [],
    currentPage: '',
    lastFetch: {
      agents: null,
      agentStats: null,
      cases: null,
      orders: null,
      gcAgents: null,
      dailyLogs: null,
    },
    // Track which components are currently active
    activeComponents: new Set(),
    dateRange: (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      // Use UTC methods to avoid timezone issues
      const firstDay = new Date(Date.UTC(year, month, 1));
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      return [
        firstDay.toISOString().split('T')[0],
        lastDay.toISOString().split('T')[0],
      ];
    })(),
  },
  
  getters: {
    enrichedAgents(state) {
      return state.agents.map(agent => {
        const stats = state.agentStats.find(stat => stat.name === agent.name)
        return { ...agent, ...stats }
      })
    },
    user: state => state.user,
    users: state => state.users,
    cases: state => state.cases,
    GcCases: state => state.GcCases,
    agents: state => state.agents,
    agentStats: state => state.agentStats,
    orders: state => state.orders,
    currentPage: state => state.currentPage,
    currentDate: () => new Date().toISOString(),
    currentDateRange: state => state.dateRange,
    gcAgents: state => state.gcAgents || [],
    dailyLogs: state => state.dailyLogs || [],
    lastFetch: state => state.lastFetch,
    activeComponents: state => state.activeComponents,
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
    
    // Selective fetching based on component context
    async fetchForContext({ dispatch }, context) {
      console.log(`🔄 Selective fetching for context: ${context}`);
      
      const fetchPromises = [];
      
      switch (context) {
        case 'agentDashboard':
          fetchPromises.push(
            dispatch('fetchOrders'),
            dispatch('fetchgcAgents'),
            dispatch('fetchDailyLogs')
          );
          break;
          
        case 'assignGoals':
          fetchPromises.push(
            dispatch('fetchOrders', true), // force fetch
            dispatch('fetchgcAgents', true), // force fetch
            dispatch('fetchGcCases', true) // force fetch
          );
          break;
          
        case 'dashboard':
          fetchPromises.push(
            dispatch('fetchAgents'),
            dispatch('fetchAgentStats'),
            dispatch('fetchCases')
          );
          break;
          
        case 'ordersDashboard':
          fetchPromises.push(
            dispatch('fetchOrders'),
            dispatch('fetchgcAgents'),
            dispatch('fetchDailyLogs')
          );
          break;
          
        default:
          console.warn(`Unknown context: ${context}, fetching all data`);
          fetchPromises.push(
            dispatch('fetchOrders'),
            dispatch('fetchgcAgents'),
            dispatch('fetchDailyLogs'),
            dispatch('fetchAgents'),
            dispatch('fetchAgentStats'),
            dispatch('fetchCases')
          );
      }
      
      await Promise.all(fetchPromises);
      console.log(`✅ Data fetched for context: ${context}`);
    },
    
    async fetchAgents({ state, commit }) {
      if (state.agents.length && (Date.now() - state.lastFetch.agents < CACHE_TIMEOUT)) {
        console.log('✅ Using cached agents (data is fresh)')
        return
      }
      try {
        console.log('🌍 Fetching agents from API')
        const response = await axios.get(`${urls.backEndURL}/agent?t=${Date.now()}`)
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
        const response = await axios.get(`${urls.backEndURL}/agentStats?t=${Date.now()}`)
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
        const response = await axios.get(`${urls.backEndURL}/cases?t=${Date.now()}`)
        commit('setCases', response.data)
        commit('setLastFetch', { key: 'cases', time: Date.now() })
      } catch (error) {
        console.error('❌ Error fetching cases:', error)
      }
    },
    async fetchGcCases({ state, commit }, force = false) {
      if (!force && state.GcCases.length && (Date.now() - state.lastFetch.GcCases < CACHE_TIMEOUT)) {
        console.log('✅ Using cached GcCases (data is fresh)')
        return
      }
      try {
        console.log('🌍 Fetching cases from API')
        const response = await axios.get(`${urls.backEndURL}/GcCases?t=${Date.now()}`)
        commit('setCases', response.data)
        commit('setLastFetch', { key: 'GcCases', time: Date.now() })
      } catch (error) {
        console.error('❌ Error fetching GcCases:', error)
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

    async getCurrentMonthDateRange(){
      const now = new Date()

      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const format = (date) => date.toISOString().split('T')[0]

      return [format(firstDay), format(lastDay)]
    },
    
    async fetchUser({ state, commit }) {
      
      if (state.user) {
        console.log('✅ Using cached user data from state')
        return
      }
    
      try {
        console.log('🌍 Fetching user from API')
        const response = await axios.get(`${urls.backEndURL}/auth/me`, {
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

    async fetchUsers({ commit }) {
      const res = await axios.get(`${urls.backEndURL}/user`, { withCredentials: true })
      if (!Array.isArray(res.data)) {
        console.error('Unexpected shape from /users:', res.data)
        commit('setUsers', [])
        return
      }
      commit('setUsers', res.data) // <-- use res.data, not res.data.users
    },

    loadUserFromStorage({ commit }) {
      const user = localStorage.getItem('user')
      if (user) {
        commit('SET_USER', JSON.parse(user))
      }
    },
    async fetchOrders({ state, commit }, force = false) {
      if (!force && state.orders.length && (Date.now() - state.lastFetch.orders < CACHE_TIMEOUT)) {
        console.log('✅ Using cached orders (data is fresh)')
        return
      }
      try {
        console.log('🌍 Fetching orders from API')
        const response = await axios.get(`${urls.backEndURL}/orders?t=${Date.now()}`)
        console.log('✅ Orders fetched successfully in store:', response.data)
        commit('setOrders', response.data)
        commit('setLastFetch', { key: 'orders', time: Date.now() })
      } catch (error) {
        console.error('❌ Error fetching orders:', error)
      }
    },
    async fetchgcAgents({ state, commit }, force = false) {
      if (!force && state.gcAgents.length && (Date.now() - state.lastFetch.gcAgents < CACHE_TIMEOUT)) {
        console.log('✅ Using cached gcAgents (data is fresh)')
        return
      }
      try {
        console.log('🌍 Fetching gcAgents from API')
        const response = await axios.get(`${urls.backEndURL}/gcAgents?t=${Date.now()}`)
        console.log('✅ gcAgents fetched successfully in store:')
        commit('setgcAgents', response.data)
        commit('setLastFetch', { key: 'gcAgents', time: Date.now() })
      } catch (error) {
        console.error('❌ Error fetching gcAgents:', error)
      }
    },
    async fetchDailyLogs({ state, commit }) {
      if (state.dailyLogs.length && (Date.now() - state.lastFetch.dailyLogs < CACHE_TIMEOUT)) {
        console.log('✅ Using cached DailyLogs (data is fresh)', state.dailyLogs)
        return
      }
      try {
        console.log('🌍 Fetching DailyLogs from API')
        const response = await axios.get(`${urls.backEndURL}/dailyLogs?t=${Date.now()}`)
        console.log('✅ DailyLogs fetched successfully in store:', response.data)
        commit('setDailyLogs', response.data)
        commit('setLastFetch', { key: 'dailyLogs', time: Date.now() })
      } catch (error) {
        console.error('❌ Error fetching dailyLogs:', error)
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
    setGcCases(state, GcCases) {
      state.GcCases = GcCases
    },
    setCurrentPage(state, currentPage) {
      state.currentPage = currentPage
    },
    setDateRange(state, range) {
      state.dateRange = range
    },
    setOrders(state, orders) {
      state.orders = orders
    },
    setgcAgents(state, gcAgents) {
      state.gcAgents = gcAgents
    },
    setDailyLogs(state, dailyLogs) {
      state.dailyLogs = dailyLogs
    },
    SET_USER(state, user) {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    setUsers(state, users) {
      state.users = users 
    },
    addActiveComponent(state, component) {
      state.activeComponents.add(component)
    },
    removeActiveComponent(state, component) {
      state.activeComponents.delete(component)
    },
    LOGOUT(state) {
      state.user = null
      localStorage.removeItem('user')
    }
  },
})

export default store
