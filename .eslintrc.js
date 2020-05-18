module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser : 'babel-eslint'
  },
  extends: [
    'standard'
  ],
  rules: {
    'prefer-const':'error',
    'no-var':'error',
    'prefer-template': 'error',
    'standard/array-bracket-even-spacing':["error", "never"]
  }
}
