export function getMonthKey (date_start){
    const keyDate = new Date(date_start);
    const keyMonth = keyDate.getMonth() + 1;
    const keyYear = keyDate.getFullYear();
    const monthKey = `${keyYear}-${keyMonth}`;
    console.log('monthKey in utils', monthKey);
    return monthKey;
}