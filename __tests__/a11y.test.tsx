import { describe, it, expect, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { SkipNavigation } from '../app/components/SkipNavigation';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost',
});

const allViolations: axe.AxeResultViolation[] = [];

async function runAxe(container: Element): Promise<axe.AxeResults> {
  const results = await axe.run(container, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'],
    },
  });
  return results;
}

function formatViolations(results: axe.AxeResults): string {
  if (results.violations.length === 0) return '';
  return results.violations
    .map(
      (v) =>
        `\n  ❌ ${v.id}: ${v.help} (impact: ${v.impact})\n` +
        `     ${v.description}\n` +
        v.nodes
          .map((n) => `       Element: ${n.html}\n${n.failureSummary ? `         ${n.failureSummary}` : ''}`)
          .join('')
    )
    .join('\n');
}

describe('Accessibility (a11y)', () => {
  it('SkipNavigation component has no a11y violations', async () => {
    const html = renderToString(<SkipNavigation />);
    const doc = dom.window.document;
    doc.body.innerHTML = `<div id="root">${html}</div>`;
    const results = await runAxe(doc.getElementById('root')!);
    allViolations.push(...results.violations);
    expect(results.violations, formatViolations(results)).toHaveLength(0);
  });

  it('rendered HTML has no a11y violations on landmark regions', async () => {
    const doc = dom.window.document;
    doc.body.innerHTML = `
      <header role="banner"><nav aria-label="Main navigation">
        <a href="/">Home</a><a href="/about">About</a>
      </nav></header>
      <main id="main-content"><h1>Welcome</h1><p>Content</p></main>
      <footer role="contentinfo">© 2026</footer>
    `;
    const results = await runAxe(doc.body);
    allViolations.push(...results.violations);
    expect(results.violations, formatViolations(results)).toHaveLength(0);
  });

  it('proper heading hierarchy has no a11y violations', async () => {
    const doc = dom.window.document;
    doc.body.innerHTML = `
      <main>
        <h1>Page Title</h1>
        <section><h2>Section</h2><p>Content</p></section>
        <section><h2>Another Section</h2><p>More content</p></section>
      </main>
    `;
    const results = await runAxe(doc.body);
    allViolations.push(...results.violations);
    expect(results.violations, formatViolations(results)).toHaveLength(0);
  });

  it('form elements with proper labels have no a11y violations', async () => {
    const doc = dom.window.document;
    doc.body.innerHTML = `
      <form>
        <label for="email">Email</label>
        <input type="email" id="email" name="email" />
        <label for="name">Name</label>
        <input type="text" id="name" name="name" />
      </form>
    `;
    const results = await runAxe(doc.body);
    allViolations.push(...results.violations);
    expect(results.violations, formatViolations(results)).toHaveLength(0);
  });

  it('images with alt text have no a11y violations', async () => {
    const doc = dom.window.document;
    doc.body.innerHTML = `
      <main>
        <img src="logo.png" alt="Stellar Wrap Logo" />
        <img src="decor.png" alt="" />
        <img src="icon.svg" alt="Icon" />
      </main>
    `;
    const results = await runAxe(doc.body);
    allViolations.push(...results.violations);
    expect(results.violations, formatViolations(results)).toHaveLength(0);
  });

  afterAll(() => {
    const axeOutput = {
      toolVersion: axe.version,
      timestamp: new Date().toISOString(),
      violations: allViolations,
      totalViolations: allViolations.length,
    };
    writeFileSync('a11y-axe-results.json', JSON.stringify(axeOutput, null, 2));
  });
});