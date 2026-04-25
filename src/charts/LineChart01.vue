<template>
    <canvas ref="canvas" :data="data" :width="width" :height="height"></canvas>
  </template>
  
  <script>
  import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
  import { useDark } from '@vueuse/core'
  import { getChartColors } from './ChartjsConfig'
  
  import {
    Chart, LineController, LineElement, Filler, PointElement, LinearScale, TimeScale, Tooltip,
  } from 'chart.js'
  import 'chartjs-adapter-moment'
  
  import { formatStatNumber } from '@/js/formatNumbers'
  
  Chart.register(LineController, LineElement, Filler, PointElement, LinearScale, TimeScale, Tooltip)
  
  export default {
    name: 'LineChart01',
    props: ['data', 'width', 'height'],
    setup(props) {
  
      const canvas = ref(null)
      let chart = null
      const darkMode = useDark()
      const { tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = getChartColors()
      
      onMounted(() => {
        nextTick(() => {
          const el = canvas.value
          if (!el || !(el instanceof HTMLCanvasElement)) return

          try {
            chart = new Chart(el, {
              type: 'line',
              data: props.data,
              options: {
                layout: {
                  padding: 20,
                },
                scales: {
                  y: {
                    display: false,
                    beginAtZero: true,
                  },
                  x: {
                    type: 'time',
                    time: {
                      parser: 'MM-DD-YYYY',
                      unit: 'month',
                    },
                    display: false,
                  },
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      title: () => false, // Disable tooltip title
                      label: (context) => formatStatNumber(context?.parsed?.y ?? 0),
                    },
                    bodyColor: darkMode.value ? tooltipBodyColor.dark : tooltipBodyColor.light,
                    backgroundColor: darkMode.value ? tooltipBgColor.dark : tooltipBgColor.light,
                    borderColor: darkMode.value ? tooltipBorderColor.dark : tooltipBorderColor.light,
                  },
                  legend: {
                    display: false,
                  },
                },
                interaction: {
                  intersect: false,
                  mode: 'nearest',
                },
                maintainAspectRatio: false,
                resizeDelay: 200,
              },
            })
          } catch (e) {
            console.warn('LineChart01: failed to create chart', e)
            chart = null
          }
        })
      })
  
      onUnmounted(() => {
        if (chart) {
          try {
            chart.destroy()
          } catch (e) {
            /* canvas may already be detached */
          }
          chart = null
        }
      })
  
      watch(
        () => darkMode.value,
        () => {
          if (!chart) return
          try {
            if (darkMode.value) {
              chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.dark
              chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.dark
              chart.options.plugins.tooltip.borderColor = tooltipBorderColor.dark
            } else {
              chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.light
              chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.light
              chart.options.plugins.tooltip.borderColor = tooltipBorderColor.light
            }
            chart.update('none')
          } catch (e) {
            /* avoid crashing mid-update if chart/DOM is torn down */
          }
        }
      )    
  
      return {
        canvas,
      }
    }
  }
  </script>