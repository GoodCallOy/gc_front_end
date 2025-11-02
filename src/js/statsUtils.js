import axios from 'axios';
import urls from './config.js';

export function getAgentsInCase(caseName, agents) {
  const agentList = agents.filter(agent => agent.case.includes(caseName));
  return agentList
}

export function groupAgentsStatsByMonth(agents) {
  const groupedByMonth = {};

  agents.forEach(agent => {
    if (!agent.calling_date || !agent.calling_date.start) {
      console.warn(`Stat for agent ${agent.name} is missing calling_date.`);
      return;
    }

    // Create a month key in the format YYYY-MM
    const statDate = new Date(agent.calling_date.start);
    const monthKey = `${statDate.getFullYear()}-${String(statDate.getMonth() + 1).padStart(2, '0')}`;

    // Initialize the month group if it doesn't exist
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = [];
    }

    // Find or create the agent entry for this month
    let agentEntry = groupedByMonth[monthKey].find(a => a.name === agent.name);
    if (!agentEntry) {
      agentEntry = {
        name: agent.name,
        case: agent.case,
        meetings: 0,
        calls_made: 0,
        call_time: 0,
        outgoing_calls: 0,
        answered_calls: 0,
        response_rate: 0,
        calling_date: monthKey,
      };
      groupedByMonth[monthKey].push(agentEntry);
    }

    // Aggregate the stats for the agent in this month
    agentEntry.meetings += agent.meetings || 0;
    agentEntry.calls_made += agent.calls_made || 0;
    agentEntry.call_time += agent.call_time || 0;
    agentEntry.outgoing_calls += agent.outgoing_calls || 0;
    agentEntry.answered_calls += agent.answered_calls || 0;

    // Calculate response rate
    agentEntry.response_rate = agentEntry.outgoing_calls > 0
      ? parseFloat(((agentEntry.answered_calls / agentEntry.outgoing_calls) * 100).toFixed(2))
      : 0;
  });

  return groupedByMonth;
}

export function getAggregatedStats(selectedDateRange, agentsStatsByMonth) {
    
    // Aggregate the stats for the agents
    const totals = {
      meetings: 0,
      calls_made: 0,
      call_time: 0,
      outgoing_calls: 0,
      answered_calls: 0,
      response_rate: 0,
    };

    agentsStatsByMonth.forEach(agent => {
      totals.meetings += agent.meetings || 0;
      totals.calls_made += agent.calls_made || 0;
      totals.call_time += agent.call_time || 0;
      totals.outgoing_calls += agent.outgoing_calls || 0;
      totals.answered_calls += agent.answered_calls || 0;
    });

    // Calculate the overall response rate
    totals.response_rate = totals.outgoing_calls > 0
      ? parseFloat(((totals.answered_calls / totals.outgoing_calls) * 100).toFixed(2))
      : 0;
      
    return totals;
  }

export function populateCasesSortedByAgent(agentStats, selectedAgent) {
    return agentStats.filter(singleCase => singleCase.name.includes(selectedAgent));
  }
  
  export function populateCaseStatsGroupedByCase(casesSortedByAgent) {
    return casesSortedByAgent.reduce((acc, singleCase) => {
      const caseId = singleCase.case;
      if (!acc[caseId]) {
        acc[caseId] = [];
      }
      acc[caseId].push(singleCase);
      return acc;
    }, {});
  }
  
  export function populateCaseStatsGroupedByMonth(caseStatsGroupedByCase) {
    return Object.values(caseStatsGroupedByCase).flatMap(caseEntries => {
      return Object.values(caseEntries.reduce((acc, singleCase) => {
        const caseDate = new Date(singleCase.calling_date.start);
        const caseMonth = caseDate.getMonth() + 1;
        const caseYear = caseDate.getFullYear();
        const monthKey = `${caseYear}-${caseMonth}`;
  
        if (!acc[monthKey]) {
          acc[monthKey] = {
            name: singleCase.name,
            case: singleCase.case, 
            caseId: singleCase.case,
            calling_date: monthKey,
            meetings: 0,
            calls_made: 0,
            call_time: 0,
            outgoing_calls: 0,
            answered_calls: 0,
            response_rate: 0,
          };
        }
  
        acc[monthKey].meetings += singleCase.meetings || 0;
        acc[monthKey].calls_made += singleCase.calls_made || 0;
        acc[monthKey].call_time += singleCase.call_time || 0;
        acc[monthKey].outgoing_calls += singleCase.outgoing_calls || 0;
        acc[monthKey].answered_calls += singleCase.answered_calls || 0;
  
        acc[monthKey].response_rate = acc[monthKey].outgoing_calls > 0
          ? parseFloat(((acc[monthKey].answered_calls / acc[monthKey].outgoing_calls) * 100).toFixed(2))
          : 0;
        
        return acc;
      }, {}));
    });
  }
  
  export function filterCaseStatsGroupedByMonth(caseStatsGroupedByMonth, startDate, endDate) {
    const filterStart = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const filterEnd = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  
    return caseStatsGroupedByMonth.filter(stat => {
      const statDate = new Date(stat.calling_date);
      return statDate >= filterStart && statDate <= filterEnd;
    });
  }
  
  export function populateCaseStatsYTD(caseStatsGroupedByMonth) {
    const currentYear = new Date().getFullYear();
    
    let statsYTD = Object.values(caseStatsGroupedByMonth).reduce((acc, singleCase) => {
      const caseId = singleCase.caseId;
      const caseYear = parseInt(singleCase.calling_date.split('-')[0]);
      if (caseYear !== currentYear) return acc;
  
      if (!acc[caseId]) {
        acc[caseId] = {
          caseId,
          meetings: 0,
          calls_made: 0,
          call_time: 0,
          outgoing_calls: 0,
          answered_calls: 0,
          response_rate: 0
        };
      }
  
      acc[caseId].meetings += singleCase.meetings;
      acc[caseId].calls_made += singleCase.calls_made;
      acc[caseId].call_time += singleCase.call_time;
      acc[caseId].outgoing_calls += singleCase.outgoing_calls;
      acc[caseId].answered_calls += singleCase.answered_calls;
  
      return acc;
    }, {});
  
    return Object.values(statsYTD).map(caseObj => ({
      ...caseObj,
      response_rate: caseObj.outgoing_calls > 0
        ? parseFloat(((caseObj.answered_calls / caseObj.outgoing_calls) * 100).toFixed(2))
        : 0
    }));
  }
  
  export function getCurrentMonthDateRange() {
    const now = new Date();
    return [
      new Date(now.getFullYear(), now.getMonth(), 1),
      new Date(now.getFullYear(), now.getMonth() + 1, 0)
    ];
  }
  export async function fetchAgentgoalsByAgentAndMonth(agent, month) {
    try {
      // console.log('agent in function', agent)
      // console.log('month in function', month)
      
      const response = await axios.get(`${urls.backEndURL}/agentgoals/${agent}?month=${month}`);
      // console.log('AgentGoals array',response.data)
      return response.data;
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    }
  }

  /**
   * Check if an order spans multiple months
   * @param {Object} order - Order object with startDate and deadline
   * @returns {boolean} - True if order spans multiple months
   */
  export function orderSpansMultipleMonths(order) {
    if (!order.startDate || !order.deadline) return false;
    
    const start = new Date(order.startDate);
    const end = new Date(order.deadline);
    
    // Check if start and end are in different months/years
    return start.getFullYear() !== end.getFullYear() || 
           start.getMonth() !== end.getMonth();
  }

  /**
   * Get all months an order spans
   * @param {Object} order - Order object with startDate and deadline
   * @returns {Array} - Array of month objects with {year, month, startDate, endDate}
   */
  export function getOrderMonths(order) {
    if (!order.startDate || !order.deadline) return [];
    
    const start = new Date(order.startDate);
    const end = new Date(order.deadline);
    
    const months = [];
    let current = new Date(start);
    current.setDate(1); // Start of month
    
    while (current <= end) {
      const year = current.getFullYear();
      const month = current.getMonth();
      
      // First day of this month within the order range
      const monthStart = new Date(Math.max(start.getTime(), new Date(year, month, 1).getTime()));
      
      // Last day of this month within the order range
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const monthEnd = new Date(Math.min(end.getTime(), lastDayOfMonth.getTime()));
      
      months.push({
        year,
        month: month + 1, // 1-indexed for display
        monthKey: `${year}-${String(month + 1).padStart(2, '0')}`,
        startDate: monthStart,
        endDate: monthEnd,
        startDateStr: monthStart.toISOString().split('T')[0],
        endDateStr: monthEnd.toISOString().split('T')[0]
      });
      
      // Move to next month
      current.setMonth(month + 1);
    }
    
    return months;
  }

  /**
   * Calculate progress per month for an order
   * @param {Object} order - Order object
   * @param {Array} dailyLogs - Array of daily log objects
   * @returns {Array} - Array of monthly progress objects
   */
  export function calculateMonthlyProgress(order, dailyLogs) {
    if (!order || !dailyLogs || !Array.isArray(dailyLogs)) return [];
    
    const months = getOrderMonths(order);
    const orderId = order._id || order.id;
    
    // Helper to match log to order
    const isOrderMatch = (log) => {
      return (
        (log.order?._id && orderId && String(log.order._id) === String(orderId)) ||
        (log.caseId && order.caseId && String(log.caseId) === String(order.caseId)) ||
        (log.caseName && order.caseName && String(log.caseName) === String(order.caseName))
      );
    };
    
    const monthlyProgress = months.map(monthInfo => {
      const monthStart = new Date(monthInfo.startDateStr);
      const monthEnd = new Date(monthInfo.endDateStr);
      monthEnd.setHours(23, 59, 59, 999);
      
      // Filter logs for this month and order
      const monthLogs = dailyLogs.filter(log => {
        if (!isOrderMatch(log)) return false;
        const logDate = new Date(log.date);
        return logDate >= monthStart && logDate <= monthEnd;
      });
      
      // Calculate total quantity completed in this month
      const quantityCompleted = monthLogs.reduce(
        (sum, log) => sum + (Number(log.quantityCompleted) || 0),
        0
      );
      
      // Calculate revenue for this month
      const unitPrice = Number(order.pricePerUnit || 0);
      const revenue = quantityCompleted * unitPrice;
      
      return {
        ...monthInfo,
        quantityCompleted,
        revenue,
        logCount: monthLogs.length
      };
    });
    
    return monthlyProgress;
  }

  