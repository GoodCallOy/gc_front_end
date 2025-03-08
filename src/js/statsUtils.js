import axios from 'axios';

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
      const response = await axios.get(`https://goodcall.fi/api/v1/agentgoals/${agent}?month=${month}`);
      console.log('AgentGoals array',response)
      return response.data;
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    }
  }

  