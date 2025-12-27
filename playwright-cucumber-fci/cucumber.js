// cucumber.js
const common = [
  '--require-module ts-node/register',
  '--require tests/support/world.ts',
  '--require tests/hooks/**/*.ts',
  '--require tests/steps/**/*.ts',
  'tests/features/**/*.feature',
];

if (process.env.CUCUMBER_TAGS && process.env.CUCUMBER_TAGS.trim() !== '') {
  common.push(`--tags "${process.env.CUCUMBER_TAGS}"`);
}

// ReportPortal
if ((process.env.RP_ENABLE || '').toLowerCase() === 'true') {
  common.push('--format ./reportportal-formatter.cjs');
}

module.exports = {
  default: common.join(' ')
};
