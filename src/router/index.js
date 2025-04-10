import { createRouter, createWebHashHistory  } from 'vue-router';
import DashBoard from '@/components/dashBoard.vue';
import Agents from '@/components/agentsPage.vue';
import AddAgent from '@/components/addAgent.vue';
import AddAgentStats from '@/components/addAgentStats.vue';
import AddCase from '@/components/addCase.vue';
import Cases from '@/components/casesPage.vue';
import SingleCase from '@/components/singleCase.vue';
import SingleAgent from '@/components/singleAgent.vue';
import AgentInCase from '@/components/agentInCase.vue';
import AddAgentGoals from '@/components/addAgentGoals.vue';
import addAgentCaseInfo from '@/components/addAgentCaseInfo.vue';
import EditAgent from '@/components/editAgent.vue';
import Login from '@/components/LoginPage.vue';

const routes = [
  { path: '/', redirect: '/login' }, // Redirect root path to login
  { path: '/login', name: 'login', component: Login },
  { path: '/dashboard', name: 'home', component: DashBoard },
  { path: '/agents', name: 'agents', component: Agents },
  { path: '/add-agent', name: 'addAgent', component: AddAgent },
  { path: '/add-agent-stats', name: 'addAgentStats', component: AddAgentStats },
  { path: '/add-case', name: 'addCase', component: AddCase },
  { path: '/cases', name: 'cases', component: Cases },
  { path: '/add-agent-goals', name: 'addAgentGoals', component: AddAgentGoals },
  { path: '/add-agent-case-info', name: 'addAgentCaseInfo', component: addAgentCaseInfo },
  { 
    path: '/singleCase', 
    name: 'singleCase', 
    component: SingleCase,
    props: route => ({ activeCase: route.query.case }),
  },
  { 
    path: '/singleAgent', 
    name: 'singleAgent', 
    component: SingleAgent,
    props: route => ({ activeAgent: route.query.agent }),
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
  {
    path: '/editAgent',
    name: 'editAgent',
    component: EditAgent,
    props: route => ({ activeAgent: route.query.activeAgent || "" })
  }
];

const router = createRouter({
  history: createWebHashHistory (),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition; // Restore scroll position when navigating back
    } else {
      return { top: 0 }; // Scroll to top on navigation
    }
  },
});

export default router;
