export function getMonthKey (date_start){
    const keyDate = new Date(date_start);
    const keyMonth = String(keyDate.getMonth() + 1).padStart(2, '0'); 
    const keyYear = keyDate.getFullYear();
    const monthKey = `${keyYear}-${keyMonth}`;
    console.log('monthKey in utils', monthKey);
    return monthKey;
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

    // Calculate the new end date (last day of the previous month)
    const newEndDate = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0);

    const prevMonthDates = [newStartDate, newEndDate];
    
    return prevMonthDates;
  }
  export function goToNextMonth(currentDateRange) {
    const [startDate] = currentDateRange;
    const newStartDate = new Date(startDate);

    // Move to the next month
    newStartDate.setMonth(newStartDate.getMonth() + 1);
    // Calculate the new end date (last day of the next month)
    const newEndDate = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0);
    
    const nextMonthDates = [newStartDate, newEndDate];

     return nextMonthDates;
  }