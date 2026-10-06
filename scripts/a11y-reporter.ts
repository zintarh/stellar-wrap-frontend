import { readFileSync, writeFileSync } from 'node:fs';

function toSarif(data: any): object {
  const violations = data.violations || [];
  const rules = violations.map((v: any) => ({
    id: v.id,
    shortDescription: { text: v.help },
    fullDescription: { text: v.description },
    defaultConfiguration: { level: v.impact === 'critical' ? 'error' : 'warning' },
    properties: { tags: v.tags || [] },
  }));

  const results = violations.map((v: any) => ({
    ruleId: v.id,
    level: v.impact === 'critical' ? 'error' : 'warning',
    message: { text: v.help },
    locations: v.nodes.map((node: any) => ({
      physicalLocation: {
        artifactLocation: { uri: node.html || 'unknown' },
        region: { snippet: node.html || '' },
      },
      message: { text: node.failureSummary || v.help },
    })),
    partialFingerprints: { primaryLocationLineHash: v.id },
  }));

  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'axe-core',
            version: data.toolVersion || '4.x',
            informationUri: 'https://github.com/dequelabs/axe-core',
            rules,
          },
        },
        results,
      },
    ],
  };
}

function formatConsoleReport(data: any): string {
  const violations = data.violations || [];
  if (violations.length === 0) return '✅ No accessibility violations found';
  const lines = [`❌ ${violations.length} accessibility violation(s) found:\n`];
  for (const v of violations) {
    lines.push(`  ❌ ${v.help} (${v.impact})`);
    lines.push(`     ${v.description}`);
    lines.push(`     Nodes affected: ${v.nodes.length}`);
    for (const node of v.nodes) {
      lines.push(`       Element: ${node.html}`);
      if (node.failureSummary) lines.push(`         ${node.failureSummary}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

const input = process.argv[2] || 'a11y-axe-results.json';
let raw: string;
try {
  raw = readFileSync(input, 'utf-8');
} catch {
  console.error(`Error: Could not read report file: ${input}`);
  process.exit(1);
}

let data: any;
try {
  data = JSON.parse(raw);
} catch {
  console.error('Error: Invalid JSON in report file');
  process.exit(1);
}

const sarif = toSarif(data);
writeFileSync('a11y-report.sarif', JSON.stringify(sarif, null, 2));
console.log('📄 SARIF report written to a11y-report.sarif');

const consoleReport = formatConsoleReport(data);
console.log(consoleReport);

if (data.totalViolations > 0) {
  process.exit(1);
}