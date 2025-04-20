<template>
    <div class="case-card">
      <div class="menu">
        <EditMenu align="right" class="relative inline-flex">
            <li>
                <a
                    @click="showCase"
                    class="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3"                            
                >
                    Show case
                </a>
            </li>
        </EditMenu>
      </div>
      <div class="pt-5">
        <header class="flex justify-between items-start mb-2">
          <h2>{{ companyCase.name }}</h2>
          
        </header>
        <div class="label">Sales</div>
        <div class="value">
          $24,780
          <span class="percentage">+49%</span>
        </div>
      </div>
      <div class="chart">
        <!-- Chart built with Chart.js 3 -->
        <LineChart :data="chartData" width="389" height="128" />
      </div>
    </div>
  </template>
  
  
  <script>
  import { ref } from 'vue'
  import { chartAreaGradient } from '../../charts/ChartjsConfig'
  import LineChart from '../../charts/LineChart01.vue'
  import EditMenu from '../../components/DropdownEditMenu.vue'
  
  // Import utilities
  import { adjustColorOpacity } from '../../utils/Utils'
  
  export default {
    name: 'DashboardCard01',
    components: {
      LineChart,
      EditMenu,
    },
    props: {
        companyCase: {
        type: Object,
        required: true,
        default: () => ({}),
        },
        dateRange:
        {
        type: Object,
        required: true,
        default: () => ({}),
        },
    },
    setup() {
      const chartData = ref({
        labels: [
          '12-01-2022', '01-01-2023', '02-01-2023',
          '03-01-2023', '04-01-2023', '05-01-2023',
          '06-01-2023', '07-01-2023', '08-01-2023',
          '09-01-2023', '10-01-2023', '11-01-2023',
          '12-01-2023', '01-01-2024', '02-01-2024',
          '03-01-2024', '04-01-2024', '05-01-2024',
          '06-01-2024', '07-01-2024', '08-01-2024',
          '09-01-2024', '10-01-2024', '11-01-2024',
          '12-01-2024', '01-01-2025',
        ],
        datasets: [
          // Indigo line
          {
            data: [
              732, 610, 610, 504, 504, 504, 349,
              349, 504, 342, 504, 610, 391, 192,
              154, 273, 191, 191, 126, 263, 349,
              252, 423, 622, 470, 532,
            ],
            fill: true,
            backgroundColor: function(context) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              return chartAreaGradient(ctx, chartArea, [
                { stop: 0, color: adjustColorOpacity('#8b5cf6', 0) },
                { stop: 1, color: adjustColorOpacity('#8b5cf6', 0.2) }
              ]);
            },
           borderColor: '#8b5cf6',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3,
            pointBackgroundColor: '#8b5cf6',
            pointHoverBackgroundColor: '#8b5cf6',
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,          
            clip: 20,
            tension: 0.2,
          },
          // Gray line
          {
            data: [
              532, 532, 532, 404, 404, 314, 314,
              314, 314, 314, 234, 314, 234, 234,
              314, 314, 314, 388, 314, 202, 202,
              202, 202, 314, 720, 642,
            ],
            borderColor: adjustColorOpacity('#8b5cf6', 0.25),
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3,
            pointBackgroundColor: adjustColorOpacity('#8b5cf6', 0.25),
            pointHoverBackgroundColor: adjustColorOpacity('#8b5cf6', 0.25),
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,               
            clip: 20,
            tension: 0.2,
          },
        ],
      })
  
      return {
        chartData,
      } 
    },

    methods: {
        showCase() {
            this.$router.push({
                name: 'singleCase',
                query: { case: this.companyCase.name },
            });
        }
    },
}
</script>
<style scoped>
  .case-card {
  position: relative;
  background-color: #f9fafb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-family: 'Inter', sans-serif;
  width: 320px; /* optional, for consistent sizing */
}

.case-card .menu {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #9ca3af;
  font-size: 20px;
  cursor: pointer;
}

.case-card h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #111827;
}

.case-card .label {
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 500;
  color: #9ca3af;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.case-card .value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
}

.case-card .percentage {
  display: inline-block;
  background-color: #d1fae5;
  color: #10b981;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 2px 8px;
  border-radius: 9999px;
}

.case-card .chart {
  margin-top: 16px;
}
</style>