<template>
    <div class="d-flex flex-row justify-center mb-5" style="width: 75vw;">
        <v-btn color="primary" class="mr-5" @click="setPreviousMonth">-1m</v-btn>
        <v-btn color="primary" class="mr-5" @click="set3MonthsBack">-3m</v-btn>
        <v-btn color="primary" class="mr-5" @click="set6MonthsBack">-6m</v-btn>
        <v-btn color="primary" class="mr-5" @click="setLastYear">Last Year</v-btn>
        <v-btn color="primary" class="mr-5" @click="setCurrentYear">YTD</v-btn>
    </div>    
</template>

<script>
export default {     
    methods: {
        setPreviousMonth() {
            const now = new Date();
            const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            const selectedDateRange = [startOfPrevMonth, endOfPrevMonth];
            this.$emit('childEvent', selectedDateRange);
        },
        set3MonthsBack() {
            const now = new Date();
            const startOf3MonthsBack = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            const endOf3MonthsBack = new Date(now.getFullYear(), now.getMonth() - 2, 0);

            const selectedDateRange = [startOf3MonthsBack, endOf3MonthsBack];
            this.$emit('childEvent', selectedDateRange);
        },
        set6MonthsBack() {
            const now = new Date();
            const startOf6MonthsBack = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            const endOf6MonthsBack = new Date(now.getFullYear(), now.getMonth() - 5, 0);

            const selectedDateRange = [startOf6MonthsBack, endOf6MonthsBack];
            this.$emit('childEvent', selectedDateRange);
        },
        setLastYear() {
            const now = new Date();
            const lastYear = now.getFullYear() - 1; // Previous year
            
            const startOfLastYear = new Date(lastYear, 0, 1); // Jan 1st
            const endOfLastYear = new Date(lastYear, 11, 31); // Dec 31st

            const selectedDateRange = [startOfLastYear, endOfLastYear];
            console.log("🔄 Switched to last year:", this.selectedDateRange);
            this.$emit('childEvent', selectedDateRange);
        },
        setCurrentYear() {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st of the current year
            const endOfYear = now; // Today's date

            const selectedDateRange = [startOfYear, endOfYear];
            this.$emit('childEvent', selectedDateRange);
        },
    }
}
</script>