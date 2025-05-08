<template>
    <Bar :data="chartData" :options="chartOptions" />
  </template>
  
  <script>
  import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
  } from 'chart.js'
  import { Bar } from 'vue-chartjs'
  
  ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
  )
  
  export default {
    name: 'BarChart',
    components: {
      Bar
    },
    data () {
      return {
        chartData: {
          labels: ['M', 'T', 'W', 'T', 'F'],
          datasets: [
            {
              label: 'Sales',
              data: [45, 50, 55, 40, 20, 60, 65],
              backgroundColor: '#3f51b5'
            },
            {
              label: 'Revenue',
              data: [15, 25, 20, 30, 20, 20, 15],
              backgroundColor: '#64b5f6'
            }
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
  