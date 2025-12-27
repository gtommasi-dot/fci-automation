module.exports = {
  apiKey: process.env.RP_API_KEY,
  endpoint: process.env.RP_ENDPOINT,
  project: process.env.RP_PROJECT,
  launch: process.env.RP_LAUNCH || 'FCI E2E',
  description: `Run ${new Date().toISOString()} | FRAMEWORK_TYPE=${process.env.FRAMEWORK_TYPE}`,
  attributes: [
    { key: 'framework', value: 'cucumber' },
    { key: 'type', value: process.env.FRAMEWORK_TYPE || 'LEGACY' }
  ],
  takeScreenshot: 'onFailure'
};
