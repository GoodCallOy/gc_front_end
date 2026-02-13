<template>
  <v-btn
    icon
    variant="text"
    size="small"
    color="grey"
    :title="title"
    :class="iconClass"
    @click.stop="$emit('click')"
  >
    <v-icon>{{ icon }}</v-icon>
  </v-btn>
</template>

<script>
/**
 * Standard action icon button for tables (edit, delete, copy, etc.).
 * Use this component across all pages for consistent icon styling.
 *
 * Props:
 *   - icon: Material Design icon name (e.g. 'mdi-pencil', 'mdi-delete')
 *   - title: Tooltip text
 *   - iconClass: Optional CSS class (e.g. 'mr-2')
 *
 * Usage:
 *   <ActionIconButton icon="mdi-pencil" :title="t('agentDashboard.editLog')" @click="editLog(item)" />
 *   <ActionIconButton icon="mdi-delete" :title="t('agentDashboard.deleteLog')" @click="deleteLog(item)" />
 */
export default {
  name: 'ActionIconButton',
  props: {
    icon: { type: String, required: true },
    title: { type: String, default: '' },
    iconClass: { type: String, default: '' },
  },
  emits: ['click'],
};
</script>
