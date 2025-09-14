import { createRouter, createWebHashHistory  } from 'vue-router';

import store from '@/store';

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
import assignGoals from '@/components/orders/assignGoals.vue';
import agentDashboard from '@/components/agentDashboard.vue';
import agentCaseDetails from '@/components/agentCaseDetails.vue';
import listGcAgents from '@/components/agents/listGcAgents.vue';
import editGcAgent from '@/components/agents/editGcAgent.vue';


const routes = [
  { path: '/', redirect: '/login' }, // Redirect root path to login
  { path: '/login', name: 'login', component: Login },
  { path: '/post-login', name: 'postLogin', component: () => import('@/components/postLogin.vue') },
  
  {
    path: '/',
    component: MainLayout,
    children: [
      
      { path: 'dashboard', name: 'home', component: DashBoard, meta: { requiresAuth: true, roles: ['admin', 'manager'] }  },
      { path: 'dashboard2', name: 'dash2', component: DashBoard2, meta: { requiresAuth: true, roles: ['admin', 'manager'] }  },
      { path: 'agentDashboard', name: 'agentDashboard', component: agentDashboard, meta: { requiresAuth: true, roles: ['caller'] }  },
      { path: 'listGcAgents', name: 'listGcAgents', component: listGcAgents, meta: { requiresAuth: true, roles: ['admin'] }  },  
      { path: 'editGcAgent', name: 'editGcAgent', component: editGcAgent, meta: { requiresAuth: true, roles: ['admin'] },
        props: route => ({ activeAgent: route.query.activeAgent || "" })  
      },
      { path: 'agents', name: 'agents', component: Agents },
      { path: 'add-agent', name: 'addAgent', component: AddAgent },
      { path: 'add-gc-agent', name: 'addGcAgent', component: AddGcAgent },
      { path: 'add-agent-stats', name: 'addAgentStats', component: AddAgentStats },
      { path: 'add-case', name: 'addCase', component: AddCase },
      { path: 'add-case-form', name: 'addCaseForm', component: AddCaseform },
      { path: 'add-order', name: 'addOrderForm', component: addOrderForm },
      { path: 'edit-order/:id', name: 'editOrderForm', component: addOrderForm, props: true },
      { path: 'cases', name: 'cases', component: Cases },
      { path: 'add-daily-log', name: 'addDailyLog', component: addDailyLog },
      { path: 'add-agent-goals', name: 'addAgentGoals', component: AddAgentGoals },
      { path: 'add-agent-case-info', name: 'addAgentCaseInfo', component: addAgentCaseInfo },
      { path: 'order-progress-chart', name: 'OrderProgressTable', component: OrderProgressTable },
      { path: 'order-dashboard', name: 'orderDashboard', component: orderDashboard, meta: { requiresAuth: true, roles: ['admin', 'manager'] } },
      { path: 'order-details', name: 'orderDetails', component: orderDetails, meta: { requiresAuth: true, roles: ['admin', 'manager'] } },
      { path: 'agent-case-details', name: 'agentCaseDetails', component: agentCaseDetails },
      { path: 'assign-goals', name: 'assignGoals', component: assignGoals, meta: { requiresAuth: true, roles: ['admin', 'manager'] } },
      { 
        path: 'singleCase', 
        name: 'singleCase', 
        component: SingleCase,
        props: route => ({ activeCase: route.query.case }),
      },
      { 
        path: 'singleAgent', 
        name: 'singleAgent', 
        component: SingleAgent,
        props: route => ({ activeAgent: route.query.agent }),
      },
      { 
        path: 'agentInCase', 
        name: 'agentInCase', 
        component: AgentInCase,
        props: route => ({
          activeAgent: route.query.agent, 
          activeCase: route.query.case,
        }),
      },
      {
        path: 'editAgent',
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

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    const base64Payload = parts[1];
    const json = atob(base64Payload || '');
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decode JWT payload:', error);
    return null;
  }
}

function getCurrentUserRole() {
  // 1) Vuex store (preferred)
  const storeUser = store.state.user?.user;
  if (storeUser?.role) return storeUser.role;

  // 2) Cached user from localStorage (your PostLogin writes this)
  try {
    const cached = localStorage.getItem('auth_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.role) return parsed.role;
    }
  } catch {}

  // 3) (Optional) JWT fallback if you ever use one
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      if (payload?.role) return payload.role;
    } catch {}
  }

  return null;
}

function getHomeRouteNameForRole(role) {
  if (role === 'admin' || role === 'manager') return 'orderDashboard'; // /order-dashboard
  if (role === 'caller') return 'agentDashboard';                      // /agent-dashboard
  return 'login';
}

router.beforeEach((to, from, next) => {
  if (to.name === 'postLogin') return next();

  const routeRequiresAuth = to.matched.some(record => record.meta?.requiresAuth);
  const userRole = getCurrentUserRole();
  console.log('Guard role source:', getCurrentUserRole());

  // If a route needs auth and we don't know the user's role yet, send to login.
  if (routeRequiresAuth && !userRole) {
    return next({ name: 'login' });
  }

  // If a logged-in user hits /login, send them to the correct home
  if (to.name === 'login' && userRole) {
    return next({ name: getHomeRouteNameForRole(userRole) });
  }

  // Enforce role restrictions on routes that specify `meta.roles`
  const routeHasRoleRestrictions = Array.isArray(to.meta?.roles);
  if (routeHasRoleRestrictions && userRole && !to.meta.roles.includes(userRole)) {
    return next({ name: getHomeRouteNameForRole(userRole) });
  }

  next();
});

export default router;