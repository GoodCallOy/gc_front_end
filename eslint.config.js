const vue = require('eslint-plugin-vue')
const vueParser = require('vue-eslint-parser')
const babelParser = require('@babel/eslint-parser')
const vueRecommended = require('eslint-plugin-vue/dist/configs/vue3-recommended.js')

module.exports = [
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: babelParser,
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        requireConfigFile: false
      },
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
    rules: {
      ...vueRecommended.rules
    }
  }
]
