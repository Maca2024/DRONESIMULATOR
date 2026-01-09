module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['react', '@typescript-eslint', 'react-hooks'],
  settings: {
    react: {
      version: '18.2',
    },
  },
  rules: {
    // TypeScript strict rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/strict-boolean-expressions': 'off',

    // React rules
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // Allow react-three-fiber intrinsic elements
    'react/no-unknown-property': ['error', {
      ignore: [
        'args', 'position', 'rotation', 'scale', 'castShadow', 'receiveShadow',
        'intensity', 'attach', 'array', 'count', 'itemSize', 'object',
        'transparent', 'opacity', 'side', 'metalness', 'roughness',
        'emissive', 'emissiveIntensity', 'sizeAttenuation', 'geometry', 'material',
        'shadow-mapSize', 'shadow-camera-far', 'shadow-camera-left',
        'shadow-camera-right', 'shadow-camera-top', 'shadow-camera-bottom',
      ]
    }],

    // General rules
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
  },
};
