export function getMonthKey (date_start){
    const keyDate = new Date(date_start);
    const keyMonth = String(keyDate.getMonth() + 1).padStart(2, '0'); 
    const keyYear = keyDate.getFullYear();
    const monthKey = `${keyYear}-${keyMonth}`;
    console.log('monthKey in utils', monthKey);
    return monthKey;
}

// Week configuration cache
let weekConfigCache = new Map();

// Fetch week configuration for a specific month/year
import urls from '@/js/config.js'

export async function fetchWeekConfiguration(year, month) {
  const cacheKey = `${year}-${month}`;
  
  if (weekConfigCache.has(cacheKey)) {
    return weekConfigCache.get(cacheKey);
  }
  
  try {
    const response = await fetch(`${urls.backEndURL}/week-config/${year}/${month}`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const config = await response.json();
      weekConfigCache.set(cacheKey, config);
      return config;
    }
  } catch (error) {
    console.warn('Failed to fetch week configuration, using default:', error);
  }
  
  // Return default configuration if fetch fails
  return generateDefaultWeekConfig(year, month);
}

// Generate default week configuration (Monday-Sunday)
export function generateDefaultWeekConfig(year, month) {
  const weeks = [];
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  
  let currentDate = new Date(monthStart);
  let weekNumber = 1;
  
  while (currentDate <= monthEnd) {
    // Find Monday of current week
    const dayOfWeek = currentDate.getDay();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    
    // Find Sunday of current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Adjust to month boundaries
    const weekStart = monday < monthStart ? monthStart : monday;
    const weekEnd = sunday > monthEnd ? monthEnd : sunday;
    
    weeks.push({
      weekNumber,
      startDate: weekStart,
      endDate: weekEnd,
      isActive: true
    });
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
    weekNumber++;
  }
  
  return {
    year,
    month,
    weeks,
    isDefault: true
  };
}

// Get custom week range for a given date
export async function getCustomWeekRange(date) {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  
  const config = await fetchWeekConfiguration(year, month);
  
  // Find which week this date belongs to
  for (const week of config.weeks) {
    const weekStart = new Date(week.startDate);
    const weekEnd = new Date(week.endDate);
    
    if (dateObj >= weekStart && dateObj <= weekEnd) {
      return {
        start: weekStart,
        end: weekEnd,
        weekNumber: week.weekNumber,
        year: year,
        isCustom: !config.isDefault
      };
    }
  }
  
  // Fallback to default week calculation if not found in custom config
  return getDefaultWeekRange(date);
}

// Get default week range (Monday-Sunday)
export function getDefaultWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: monday,
    end: sunday,
    weekNumber: getWeekNumber(date),
    year: d.getFullYear(),
    isCustom: false
  };
}

// Get week number for a date (ISO week numbering)
export function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.ceil((((d - week1) / 86400000) + week1.getDay() + 1) / 7);
}

// Get all weeks for a month using custom configuration
export async function getMonthWeeks(year, month) {
  const config = await fetchWeekConfiguration(year, month);
  return config.weeks.map(week => ({
    weekNumber: week.weekNumber,
    start: new Date(week.startDate),
    end: new Date(week.endDate),
    isActive: week.isActive,
    notes: week.notes || '',
    isCustom: !config.isDefault
  }));
}

// Clear week configuration cache (useful when configurations are updated)
export function clearWeekConfigCache() {
  weekConfigCache.clear();
}

export function formattedDateRange(currentDateRange) {
    if (!currentDateRange || currentDateRange.length < 2) {
      return '';
    }
    console.log('currentDateRange 1 in utils', currentDateRange);
    console.log('currentDateRange 2 in utils', currentDateRange[0]);
    const [startDate] = currentDateRange;
    const date = new Date(startDate);

    // Format to MM-YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero
    const year = date.getFullYear();
    console.log('formattedDateRange in utils', `${month}-${year}`);

    return `${month}-${year}`;
    }

    export function isCurrentMonth(currentDateRange) {
    if (!currentDateRange || currentDateRange.length < 2) {
      return false;
    }

    const [startDate] = currentDateRange;
    const currentDate = new Date();

    // Check if the current month and year match the startDate
    return (
      currentDate.getMonth() === new Date(startDate).getMonth() &&
      currentDate.getFullYear() === new Date(startDate).getFullYear()
    );
  }
  export function goToPreviousMonth(currentDateRange) {
    const [startDate] = currentDateRange;
    const newStartDate = new Date(startDate);

    // Move to the previous month
    newStartDate.setMonth(newStartDate.getMonth() - 1);

    // Calculate the new end date (last day of the previous month) using UTC
    const newEndDate = new Date(Date.UTC(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0));

    // Format dates as ISO strings for consistency with store
    const prevMonthDates = [
      newStartDate.toISOString().split('T')[0], 
      newEndDate.toISOString().split('T')[0]
    ];
    
    return prevMonthDates;
  }
  export function goToNextMonth(currentDateRange) {
    const [startDate] = currentDateRange;
    const newStartDate = new Date(startDate);

    // Move to the next month
    newStartDate.setMonth(newStartDate.getMonth() + 1);
    // Calculate the new end date (last day of the next month) using UTC
    const newEndDate = new Date(Date.UTC(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0));
    
    // Format dates as ISO strings for consistency with store
    const nextMonthDates = [
      newStartDate.toISOString().split('T')[0], 
      newEndDate.toISOString().split('T')[0]
    ];

     return nextMonthDates;
  }