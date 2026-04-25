<template>
  <div class="line-chart-01" :style="wrapperStyle">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed, toRaw } from 'vue'
import { useDark } from '@vueuse/core'
import { getChartColors } from './ChartjsConfig'

import {
  Chart, LineController, LineElement, Filler, PointElement, LinearScale, TimeScale, Tooltip,
} from 'chart.js'
import 'chartjs-adapter-moment'

import { formatStatNumber } from '@/js/formatNumbers'

Chart.register(LineController, LineElement, Filler, PointElement, LinearScale, TimeScale, Tooltip)

function chartOptions(
  darkMode,
  { tooltipBodyColor, tooltipBgColor, tooltipBorderColor }
) {
  return {
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
          title: () => false,
          label: (context) => formatStatNumber(context?.parsed?.y ?? 0),
        },
        bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
        backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
        borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
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
  }
}

function applyChartData(chart, rawData) {
  if (!chart || !rawData) return
  chart.data.labels = rawData.labels
  chart.data.datasets = rawData.datasets
  chart.update()
}

export default {
  name: 'LineChart01',
  props: ['data', 'width', 'height'],
  setup(props) {
    const canvas = ref(null)
    let chart = null
    const darkMode = useDark()
    const { tooltipBodyColor, tooltipBgColor, tooltipBorderColor } = getChartColors()

    const wrapperStyle = computed(() => ({
      width: props.width != null && props.width !== '' ? `${Number(props.width)}px` : '100%',
      height: props.height != null && props.height !== '' ? `${Number(props.height)}px` : '128px',
      position: 'relative',
    }))

    function createChart() {
      const el = canvas.value
      if (!el || !(el instanceof HTMLCanvasElement) || !el.isConnected) return
      if (chart) {
        try {
          chart.destroy()
        } catch {
          /* ignore */
        }
        chart = null
      }
      const raw = toRaw(props.data)
      if (!raw) return
      try {
        chart = new Chart(el, {
          type: 'line',
          data: raw,
          options: chartOptions(darkMode.value, {
            tooltipBodyColor, tooltipBgColor, tooltipBorderColor
          }),
        })
      } catch (e) {
        console.warn('LineChart01: failed to create chart', e)
        chart = null
      }
    }

    onMounted(() => {
      nextTick(() => {
        createChart()
      })
    })

    onBeforeUnmount(() => {
      if (chart) {
        try {
          chart.destroy()
        } catch {
          /* canvas may already be detached */
        }
        chart = null
      }
    })

    watch(
      () => props.data,
      () => {
        if (!chart) {
          nextTick(() => createChart())
          return
        }
        try {
          const raw = toRaw(props.data)
          applyChartData(chart, raw)
        } catch (e) {
          console.warn('LineChart01: data update failed', e)
        }
      },
      { deep: true }
    )

    watch(
      () => darkMode.value,
      () => {
        if (!chart) return
        if (!canvas.value?.isConnected) return
        try {
          const o = chart.options
          o.plugins.tooltip.bodyColor = darkMode.value ? tooltipBodyColor.dark : tooltipBodyColor.light
          o.plugins.tooltip.backgroundColor = darkMode.value ? tooltipBgColor.dark : tooltipBgColor.light
          o.plugins.tooltip.borderColor = darkMode.value ? tooltipBorderColor.dark : tooltipBorderColor.light
          chart.update('none')
        } catch {
          /* avoid crashing mid-update if chart/DOM is torn down */
        }
      }
    )

    return {
      canvas,
      wrapperStyle,
    }
  },
}
</script>
