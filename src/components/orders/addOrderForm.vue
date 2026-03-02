<template>
  <div class="d-flex flex-column align-center" style="min-height: 100vh; padding: 20px;">
    <OrderForm
      :order-id="orderIdFromRoute"
      :modal="false"
      @saved="onSaved"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import OrderForm from './OrderForm.vue'

const route = useRoute()

const orderIdFromRoute = computed(() => route.params.id || null)

function onSaved() {
  // Message is shown by OrderForm when not in modal
}
</script>
