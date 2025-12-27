// cucumber.js
const common = [
  '--require-module ts-node/register',
  '--require tests/support/world.ts',
  '--require tests/hooks/**/*.ts',
  '--require tests/steps/**/*.ts',
  'tests/features/**/*.feature',
];

// Tags (robusto para Windows + expresiones con espacios)
const rawTags = process.env.CUCUMBER_TAGS?.trim();
if (rawTags) {
  common.push(`--tags ${JSON.stringify(rawTags)}`);
}

// ReportPortal (solo cuando RP_ENABLE=true)
if ((process.env.RP_ENABLE || '').toLowerCase() === 'true') {
  common.push('--format ./reportportal-formatter.cjs');
}

module.exports = {
  default: common.join(' '),
};
