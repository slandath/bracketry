// jest.config.cjs
module.exports = async () => {
  return {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    globals: {
      'ts-jest': { useESM: true },
    },
    moduleNameMapper: {
      '\\.(css|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    },
    verbose: true,
  };
};
