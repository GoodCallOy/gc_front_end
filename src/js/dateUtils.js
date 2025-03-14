export function getMonthKey (date_start){
    const keyDate = new Date(date_start);
    const keyMonth = String(keyDate.getMonth() + 1).padStart(2, '0'); 
    const keyYear = keyDate.getFullYear();
    const monthKey = `${keyYear}-${keyMonth}`;
    console.log('monthKey in utils', monthKey);
    return monthKey;
}