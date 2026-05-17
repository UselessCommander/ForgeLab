import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

/**
 * Pragmatic v1 lint gate: Next defaults with noisy React Compiler hook rules relaxed.
 * Tighten rules incrementally; `npm run lint` should stay runnable on the full tree.
 */
const config = [
  ...nextCoreWebVitals,
  {
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/static-components': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'warn',
    },
  },
  {
    ignores: [
      'supabase/.temp/**',
      'test-ai.js',
    ],
  },
]

export default config
