import { createRouter, createWebHashHistory  } from 'vue-router';
import MainLayout from '@/layouts/mainLayout.vue';

import DashBoard from '@/components/dashBoard.vue';
import DashBoard2 from '@/components/dashboard2.vue';
import Agents from '@/components/agentsPage.vue';
import AddAgent from '@/components/addAgent.vue';
import AddGcAgent from '@/components/agents/addAgentForm.vue';
import AddAgentStats from '@/components/addAgentStats.vue';
import Cases from '@/components/cases/casesPage.vue';
import AddCase from '@/components/cases/addCase.vue';
import AddCaseform from '@/components/cases/addCaseForm.vue';
import addOrderForm from '@/components/orders/addOrderForm.vue';
import SingleCase from '@/components/singleCase.vue';
import SingleAgent from '@/components/singleAgent.vue';
import AgentInCase from '@/components/agentInCase.vue';
import AddAgentGoals from '@/components/addAgentGoals.vue';
import addAgentCaseInfo from '@/components/addAgentCaseInfo.vue';
import EditAgent from '@/components/editAgent.vue';
import addDailyLog from '@/components/DailyLogForm.vue';
import Login from '@/components/LoginPage.vue';
import OrderProgressTable from '@/components/OrderProgressTable.vue';
import orderDashboard from '@/components/ordersDashboard.vue';
import orderDetails from '@/components/orderDetails.vue';

const routes = [
  { path: '/', redirect: '/login' }, // Redirect root path to login
  { path: '/login', name: 'login', component: Login },
  
  
  {
    path: '/',
    component: MainLayout,
    children: [
      
      { path: '/dashboard', name: 'home', component: DashBoard },
      { path: '/dashboard2', name: 'dash2', component: DashBoard2 },
      { path: '/agents', name: 'agents', component: Agents },
      { path: '/add-agent', name: 'addAgent', component: AddAgent },
      { path: '/add-gc-agent', name: 'addGcAgent', component: AddGcAgent },
      { path: '/add-agent-stats', name: 'addAgentStats', component: AddAgentStats },
      { path: '/add-case', name: 'addCase', component: AddCase },
      { path: '/add-case-form', name: 'addCaseForm', component: AddCaseform },
      { path: '/add-order', name: 'addOrderForm', component: addOrderForm },
      { path: '/cases', name: 'cases', component: Cases },
      { path: '/add-daily-log', name: 'addDailyLog', component: addDailyLog },
      { path: '/add-agent-goals', name: 'addAgentGoals', component: AddAgentGoals },
      { path: '/add-agent-case-info', name: 'addAgentCaseInfo', component: addAgentCaseInfo },
      { path: '/order-progress-chart', name: 'OrderProgressTable', component: OrderProgressTable },
      { path: '/order-dashboard', name: 'orderDashboard', component: orderDashboard },
      { path: '/order-details', name: 'orderDetails', component: orderDetails },
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
      },
    ],
  },
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
