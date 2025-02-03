import { createRouter, createWebHistory } from 'vue-router';
import DashBoard from '@/components/dashBoard.vue';
import Agents from '@/components/agentsPage.vue';
import AddAgent from '@/components/addAgent.vue';
import AddAgentStats from '@/components/addAgentStats.vue';
import AddCase from '@/components/addCase.vue';
import Cases from '@/components/casesPage.vue';
import SingleCase from '@/components/singleCase.vue';
import SingleAgent from '@/components/singleAgent.vue';
import AgentInCase from '@/components/agentInCase.vue';

const routes = [
  { path: '/', name: 'home', component: DashBoard },
  { path: '/agents', name: 'agents', component: Agents },
  { path: '/add-agent', name: 'addAgent', component: AddAgent },
  { path: '/add-agent-stats', name: 'addAgentStats', component: AddAgentStats },
  { path: '/add-case', name: 'addCase', component: AddCase },
  { path: '/cases', name: 'cases', component: Cases },
  { 
    path: '/singleCase', 
    name: 'singleCase', 
    component: SingleCase,
    props: route => ({ activeCase: route.query.case }), // Pass active case as a prop
  },
  { 
    path: '/singleAgent', 
    name: 'singleAgent', 
    component: SingleAgent,
    props: route => ({ activeAgent: route.query.agent }), // Pass active case as a prop
  },
  { 
    path: '/agentInCase', 
    name: 'agentInCase', 
    component: AgentInCase,
    props: route => ({
      activeAgent: route.query.agent, 
      activeCase: route.query.case,
    }),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
