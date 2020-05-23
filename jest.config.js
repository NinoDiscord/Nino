module.exports = {
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec)).(jsx?|tsx?)$',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json']
};