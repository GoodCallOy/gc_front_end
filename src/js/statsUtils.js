import axios from 'axios';
import urls from './config.js';

export function getAgentsInCase(caseName, agents) {
  console.log('caseName', caseName)
 
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
      console.log('aggregatedStats:', totals);
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

  