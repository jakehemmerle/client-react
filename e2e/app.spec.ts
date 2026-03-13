import { test, expect } from '@playwright/test';

test.describe('App E2E Tests', () => {
  test('Map loads and auto-fetches objects', async ({ page }) => {
    await page.goto('/');
    const statusBar = page.locator('[data-testid="status-bar"]');
    await statusBar.waitFor();

    // Wait for data to load (status bar will contain "objects found")
    await expect(statusBar).toContainText('objects found', { timeout: 15000 });

    const text = await statusBar.textContent();
    console.log('Status bar text:', text);

    expect(text).toMatch(/\d+ objects found/);
    const count = parseInt(text!.match(/(\d+) objects found/)![1]);
    expect(count).toBeGreaterThan(0);

    // MapLibre renders to canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('Clicking a marker shows popup with properties', async ({ page }) => {
    let featureData: any = null;

    // Intercept the /objects response to get feature coordinates
    await page.route('**/objects', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      featureData = json.features[0];
      await route.fulfill({ response });
    });

    await page.goto('/');
    const statusBar = page.locator('[data-testid="status-bar"]');
    await expect(statusBar).toContainText('objects found', { timeout: 15000 });

    expect(featureData).toBeTruthy();
    const [lng, lat] = featureData.geometry.coordinates;
    console.log('Feature coordinates:', { lng, lat });
    console.log('Feature properties:', featureData.properties);

    // Wait for map to expose __testMap via onLoad
    await page.waitForFunction(() => !!(window as any).__testMap, null, { timeout: 10000 });

    // Project geo coordinates to pixel position using the exposed map
    const pixel = await page.evaluate(([lng, lat]) => {
      const map = (window as any).__testMap;
      if (!map) throw new Error('Map not available');
      const point = map.project([lng, lat]);
      return { x: point.x, y: point.y };
    }, [lng, lat]);

    console.log('Projected pixel:', pixel);

    // Click on the canvas at the projected position
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: pixel.x, y: pixel.y } });

    // Wait for popup
    const popup = page.locator('.maplibregl-popup');
    await expect(popup).toBeVisible({ timeout: 5000 });

    const popupText = await popup.textContent();
    console.log('Popup text:', popupText);

    expect(popupText).toContain('Height AGL:');
    expect(popupText).toContain('City:');
    expect(popupText).toContain('ft');
    expect(popupText).toContain('mi');
  });

  test('Clicking empty map fetches new data', async ({ page }) => {
    await page.goto('/');
    const statusBar = page.locator('[data-testid="status-bar"]');
    await expect(statusBar).toContainText('objects found', { timeout: 15000 });

    const initialText = await statusBar.textContent();
    console.log('Initial status:', initialText);

    // Click on the top-left corner of the canvas (away from data center)
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 50, y: 50 } });

    // Should show loading state
    await expect(statusBar).toContainText('Loading', { timeout: 5000 });

    // Wait for loading to finish
    await expect(statusBar).toContainText('objects found', { timeout: 15000 });

    const newText = await statusBar.textContent();
    console.log('New status:', newText);

    expect(newText).toMatch(/\d+ objects found/);
  });

  test('Objects visually distinguished by height', async ({ page }) => {
    let features: any[] = [];

    await page.route('**/objects', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      features = json.features;
      await route.fulfill({ response });
    });

    await page.goto('/');
    const statusBar = page.locator('[data-testid="status-bar"]');
    await expect(statusBar).toContainText('objects found', { timeout: 15000 });

    const aglValues = features.map((f: any) => f.properties.AGL);
    const minAGL = Math.min(...aglValues);
    const maxAGL = Math.max(...aglValues);
    const uniqueAGLs = new Set(aglValues).size;
    console.log('AGL range:', { min: minAGL, max: maxAGL, uniqueCount: uniqueAGLs });

    expect(minAGL).toBeLessThan(300);
    expect(maxAGL).toBeGreaterThan(300);

    // Wait for map to expose __testMap via onLoad
    await page.waitForFunction(() => !!(window as any).__testMap, null, { timeout: 10000 });

    // Check MapLibre paint properties for the circle layer
    const paintProps = await page.evaluate(() => {
      const map = (window as any).__testMap;
      if (!map) throw new Error('Map not available');
      return {
        circleRadius: map.getPaintProperty('objects-circle', 'circle-radius'),
        circleColor: map.getPaintProperty('objects-circle', 'circle-color'),
      };
    });

    console.log('Circle radius property:', JSON.stringify(paintProps.circleRadius));
    console.log('Circle color property:', JSON.stringify(paintProps.circleColor));

    // They should be interpolation expressions (arrays), not flat values
    expect(Array.isArray(paintProps.circleRadius)).toBe(true);
    expect(Array.isArray(paintProps.circleColor)).toBe(true);
  });
});
