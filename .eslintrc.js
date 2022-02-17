module.exports = {
  extends: 'galex',
  plugins: ['prettier'],
  rules: {
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    'prettier/prettier': 'error'
  }
}
