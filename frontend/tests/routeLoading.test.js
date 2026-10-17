import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

test('FE-007: Route loading optimization and test route isolation', async (t) => {
  const appRoutesPath = path.join(frontendDir, 'src/routes/AppRoutes.jsx');

  await t.test('verifies AppRoutes.jsx uses React.lazy for production pages', () => {
    assert.ok(fs.existsSync(appRoutesPath), 'AppRoutes.jsx must exist');
    const content = fs.readFileSync(appRoutesPath, 'utf8');

    // Verify lazy loading of main routes
    assert.ok(
      content.includes("lazy(() => import('../features/landing/pages/LandingPage'))"),
      'LandingPage must be lazy loaded'
    );
    assert.ok(
      content.includes("lazy(() => import('../features/auth/pages/Login'))"),
      'Login must be lazy loaded'
    );
    assert.ok(
      content.includes("lazy(() => import('../features/auth/pages/Register'))"),
      'Register must be lazy loaded'
    );
    assert.ok(
      content.includes("lazy(() => import('../features/auth/pages/VerifyEmail'))"),
      'VerifyEmail must be lazy loaded'
    );
    assert.ok(
      content.includes("lazy(() => import('../features/dashboard/pages/Dashboard'))"),
      'Dashboard must be lazy loaded'
    );
  });

  await t.test('verifies internal test routes are strictly gated by import.meta.env.DEV', () => {
    const content = fs.readFileSync(appRoutesPath, 'utf8');

    assert.ok(
      content.includes('if (import.meta.env.DEV)'),
      'Test page dynamic imports must be enclosed in import.meta.env.DEV check'
    );
    assert.ok(
      content.includes('import.meta.env.DEV && GroupAvatarTestPage'),
      '/test route must be gated by import.meta.env.DEV'
    );
    assert.ok(
      content.includes('import.meta.env.DEV && CloudflareTestPage'),
      '/test/cloudflare route must be gated by import.meta.env.DEV'
    );
  });

  await t.test('verifies Suspense and RouteLoadingFallback are configured', () => {
    const content = fs.readFileSync(appRoutesPath, 'utf8');

    assert.ok(
      content.includes('<Suspense fallback={<RouteLoadingFallback />}>'),
      'Routes must be wrapped with Suspense fallback'
    );
    assert.ok(
      content.includes('role="status"'),
      'RouteLoadingFallback must include accessible role="status"'
    );
  });

  await t.test('verifies production build dist directory excludes test page chunks and splits code', () => {
    const distAssetsDir = path.join(frontendDir, 'dist/assets');
    if (!fs.existsSync(distAssetsDir)) {
      // If dist has not been built yet, skip asset inspection
      return;
    }

    const distFiles = fs.readdirSync(distAssetsDir);

    // Ensure no GroupAvatarTestPage or CloudflareTestPage chunks exist in dist
    const hasGroupAvatarChunk = distFiles.some((f) => f.includes('GroupAvatarTestPage'));
    const hasCloudflareChunk = distFiles.some((f) => f.includes('CloudflareTestPage'));

    assert.strictEqual(
      hasGroupAvatarChunk,
      false,
      'GroupAvatarTestPage must not be emitted in production dist assets'
    );
    assert.strictEqual(
      hasCloudflareChunk,
      false,
      'CloudflareTestPage must not be emitted in production dist assets'
    );

    // Verify index chunk is significantly smaller than the original 708kB single-bundle
    const indexChunkFile = distFiles.find((f) => f.startsWith('index-') && f.endsWith('.js'));
    assert.ok(indexChunkFile, 'Production index-*.js chunk must exist');

    const indexStats = fs.statSync(path.join(distAssetsDir, indexChunkFile));
    const indexSizeKb = indexStats.size / 1024;
    assert.ok(
      indexSizeKb < 400,
      `Expected entry chunk to be < 400 kB due to code splitting, actual: ${indexSizeKb.toFixed(2)} kB`
    );

    // Verify separate Dashboard chunk exists
    const dashboardChunkFile = distFiles.find((f) => f.startsWith('Dashboard-') && f.endsWith('.js'));
    assert.ok(dashboardChunkFile, 'Dashboard must be split into its own chunk');
  });
});
