/** @type {import('jest').Config} */
module.exports = {
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@prompt-maker/core$': '<rootDir>/packages/core/src/index.ts',
    '^@prompt-maker/core/(.*)$': '<rootDir>/packages/core/src/$1',
    '^boxen$': '<rootDir>/tests/mocks/boxen.ts',
    '^chalk$': '<rootDir>/tests/mocks/chalk.ts',
    '^ora$': '<rootDir>/tests/mocks/ora.ts',
    '^yargs$': '<rootDir>/tests/mocks/yargs.ts',
  },
}
