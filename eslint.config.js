import antfu from '@antfu/eslint-config'

export default antfu({
  stylistic: {
    semi: false,
  },
  formatters: true,
}, {
  rules: {
    'style/no-tabs': 'warn',
    'no-console': 'off',
    'unused-imports/no-unused-vars': 'off',
    'regexp/no-unused-capturing-group': 'off',
    'node/prefer-global/process': 'off',
    'no-case-declarations': 'off',
  },
})
