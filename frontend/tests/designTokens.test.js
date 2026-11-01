import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

test('FE-012: Design System Foundations & Token Completeness', async (t) => {
  const appCssPath = path.join(srcDir, 'App.css');
  assert.ok(fs.existsSync(appCssPath), 'App.css must exist');
  const appCssContent = fs.readFileSync(appCssPath, 'utf8');

  await t.test('verifies all expected radius tokens are defined in App.css', () => {
    const requiredRadii = [
      '--radius-xs',
      '--radius-sm',
      '--radius-md',
      '--radius-lg',
      '--radius-xl',
      '--radius-full',
    ];

    for (const token of requiredRadii) {
      assert.ok(
        appCssContent.includes(token),
        `App.css must define radius token ${token}`
      );
    }
  });

  await t.test('verifies all shadow tokens are defined for both light and dark themes', () => {
    const requiredShadows = [
      '--shadow-xs',
      '--shadow-sm',
      '--shadow-md',
      '--shadow-lg',
      '--shadow-xl',
    ];

    // Check light theme block
    const lightBlockMatch = appCssContent.match(/\[data-theme="light"\]\s*\{([^}]+)\}/s) ||
                            appCssContent.match(/:root[^{]*\{([^}]+)\}/s);
    assert.ok(lightBlockMatch, 'Light theme block must exist in App.css');
    const lightBlock = lightBlockMatch[1];

    for (const shadow of requiredShadows) {
      assert.ok(
        lightBlock.includes(shadow),
        `Light theme block must define shadow token ${shadow}`
      );
    }

    // Check dark theme block
    const darkBlockMatch = appCssContent.match(/\[data-theme="dark"\]\s*\{([^}]+)\}/s);
    assert.ok(darkBlockMatch, 'Dark theme block must exist in App.css');
    const darkBlock = darkBlockMatch[1];

    for (const shadow of requiredShadows) {
      assert.ok(
        darkBlock.includes(shadow),
        `Dark theme block must define shadow token ${shadow}`
      );
    }
  });

  await t.test('verifies typography variables and inheritance are established', () => {
    assert.ok(
      appCssContent.includes('--font-heading'),
      'App.css must define --font-heading token'
    );
    assert.ok(
      appCssContent.includes('--font-body'),
      'App.css must define --font-body token'
    );
    assert.ok(
      appCssContent.includes('font-family: var(--font-body)'),
      'App.css body must apply var(--font-body)'
    );
    assert.ok(
      appCssContent.includes('font-family: var(--font-heading)'),
      'App.css headings must apply var(--font-heading)'
    );
  });

  await t.test('verifies Auth.module.css does not import redundant Plus Jakarta Sans and adopts font tokens', () => {
    const authCssPath = path.join(srcDir, 'features/auth/pages/Auth.module.css');
    assert.ok(fs.existsSync(authCssPath), 'Auth.module.css must exist');
    const authCssContent = fs.readFileSync(authCssPath, 'utf8');

    assert.strictEqual(
      authCssContent.includes('Plus+Jakarta+Sans'),
      false,
      'Auth.module.css must not import external Plus Jakarta Sans'
    );
    assert.ok(
      authCssContent.includes('var(--font-body)'),
      'Auth.module.css must inherit body font via var(--font-body)'
    );
    assert.ok(
      authCssContent.includes('var(--font-heading)'),
      'Auth.module.css must inherit heading font via var(--font-heading)'
    );
  });

  await t.test('verifies hardcoded indigo loader colors are replaced by semantic tokens', () => {
    const appRoutesPath = path.join(srcDir, 'routes/AppRoutes.jsx');
    const appRoutesContent = fs.readFileSync(appRoutesPath, 'utf8');
    assert.strictEqual(
      appRoutesContent.includes('#6366f1'),
      false,
      'AppRoutes.jsx RouteLoadingFallback must not use hardcoded #6366f1'
    );
    assert.ok(
      appRoutesContent.includes('var(--primary-color'),
      'AppRoutes.jsx must use var(--primary-color) for loader'
    );

    const dashboardPath = path.join(srcDir, 'features/dashboard/pages/Dashboard.jsx');
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    assert.strictEqual(
      dashboardContent.includes('#6366f1'),
      false,
      'Dashboard.jsx permissions loader must not use hardcoded #6366f1'
    );
    assert.ok(
      dashboardContent.includes('var(--primary-color)'),
      'Dashboard.jsx permissions loader must use var(--primary-color)'
    );
  });
});
