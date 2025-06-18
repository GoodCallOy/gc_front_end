import vue from 'eslint-plugin-vue'

export default [
  {
    files: ['**/*.vue', '**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly'
      }
    },
    plugins: {
      vue
    },
    processor: vue.processors['.vue'], // optional, helps handle .vue files
    rules: {
      ...vue.configs.base.rules, // fallback if vue3-recommended doesn't exist
      // or manually add Vue rules here
    }
  }
]
