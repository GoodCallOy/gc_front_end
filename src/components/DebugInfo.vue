<template>
  <div class="debug-info" :style="debugStyle">
    <div class="debug-header">
      <h4>{{ title }}</h4>
      <v-btn 
        v-if="closable" 
        @click="$emit('close')" 
        icon="mdi-close" 
        size="small" 
        variant="text"
      />
    </div>
    
    <div class="debug-content">
      <div v-for="(value, key) in data" :key="key" class="debug-item">
        <strong>{{ formatKey(key) }}:</strong> 
        <span v-if="typeof value === 'object' && value !== null">
          <pre>{{ JSON.stringify(value, null, 2) }}</pre>
        </span>
        <span v-else>{{ value }}</span>
      </div>
      
      <div v-if="showTimestamp" class="debug-timestamp">
        <small>Last updated: {{ new Date().toLocaleTimeString() }}</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Debug Information'
  },
  data: {
    type: Object,
    required: true
  },
  closable: {
    type: Boolean,
    default: false
  },
  showTimestamp: {
    type: Boolean,
    default: true
  },
  variant: {
    type: String,
    default: 'default', // 'default', 'compact', 'minimal'
    validator: (value) => ['default', 'compact', 'minimal'].includes(value)
  }
})

const emit = defineEmits(['close'])

const debugStyle = computed(() => {
  const baseStyle = {
    background: '#f5f5f5',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '16px',
    fontFamily: 'monospace',
    fontSize: '14px'
  }

  switch (props.variant) {
    case 'compact':
      return {
        ...baseStyle,
        padding: '8px 12px',
        fontSize: '12px'
      }
    case 'minimal':
      return {
        ...baseStyle,
        background: 'transparent',
        border: '1px dashed #999',
        padding: '8px'
      }
    default:
      return baseStyle
  }
})

const formatKey = (key) => {
  // Convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}
</script>

<style scoped>
.debug-info {
  max-width: 100%;
  overflow-x: auto;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}

.debug-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.debug-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.debug-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.debug-item pre {
  margin: 0;
  padding: 8px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 3px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.debug-timestamp {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #eee;
  color: #666;
  font-style: italic;
}

/* Responsive design */
@media (max-width: 768px) {
  .debug-info {
    font-size: 12px;
    padding: 12px;
  }
  
  .debug-item pre {
    font-size: 10px;
  }
}
</style>
