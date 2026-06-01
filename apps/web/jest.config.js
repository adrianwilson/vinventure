/** @type {import('jest').Config} */
module.exports = {
  displayName: 'web',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/next/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  testMatch: [
    '<rootDir>/components/**/*.test.{ts,tsx}',
    '<rootDir>/specs/**/*.spec.{ts,tsx}',
  ],
};
