<template>
    <Line :data="chartData" :options="chartOptions" />
  </template>
  
  <script>
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Filler
  } from 'chart.js'
  import { Line } from 'vue-chartjs'
  
  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Filler
  )
  
  export default {
    name: 'LineChart',
    components: {
      Line
    },
    data () {
      return {
        chartData: {
          labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
          datasets: [
            {
              label: 'Total Revenue',
              data: [30, 28, 35, 30, 40, 35, 60, 50, 60, 40, 45, 55],
              borderColor: '#3f51b5',
              backgroundColor: 'rgba(63,81,181,0.1)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#3f51b5'
            },
          ]
        },
        chartOptions: {
          responsive: true,
          maintainAspectRatio: false
        }
      }
    }
  }
  </script>
  