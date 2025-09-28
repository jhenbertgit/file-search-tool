import { test, expect } from './utils/electron-helper';

test.describe('File Search Application E2E', () => {
  test('should launch and display the main window', async ({ page }) => {
    // Check that the main window opens
    expect(page).toBeTruthy();

    // Wait for the app to fully load
    await page.waitForSelector('#app', { timeout: 10000 });

    // Check for essential UI elements
    await expect(page.locator('h1')).toContainText('File Search');
    await expect(page.locator('#directory-input')).toBeVisible();
    await expect(page.locator('#search-input')).toBeVisible();
    await expect(page.locator('#search-button')).toBeVisible();
  });

  test('should allow directory selection', async ({ page, testDirectory }) => {
    // Click on directory browse button or set directory input
    const directoryInput = page.locator('#directory-input');
    await directoryInput.fill(testDirectory);

    // Verify the directory path is set
    await expect(directoryInput).toHaveValue(testDirectory);
  });

  test('should perform file name search', async ({ page, testDirectory }) => {
    // Set up search parameters
    await page.locator('#directory-input').fill(testDirectory);
    await page.locator('#search-input').fill('document');

    // Select file name search mode
    await page.locator('#search-type-filename').check();

    // Start search
    await page.locator('#search-button').click();

    // Wait for search results
    await page.waitForSelector('.search-results', { timeout: 10000 });

    // Check that results are displayed
    const results = page.locator('.result-item');
    await expect(results).toHaveCount(2); // document1.txt and document2.txt

    // Verify specific file names appear in results
    await expect(page.locator('.result-item')).toContainText('document1.txt');
    await expect(page.locator('.result-item')).toContainText('document2.txt');
  });

  test('should perform file content search', async ({ page, testDirectory }) => {
    // Set up search parameters
    await page.locator('#directory-input').fill(testDirectory);
    await page.locator('#search-input').fill('test');

    // Select file content search mode
    await page.locator('#search-type-content').check();

    // Start search
    await page.locator('#search-button').click();

    // Wait for search results
    await page.waitForSelector('.search-results', { timeout: 10000 });

    // Check that files containing "test" are found
    const results = page.locator('.result-item');
    await expect(results.count()).toBeGreaterThan(0);

    // Verify that files with "test" content are in results
    await expect(page.locator('.result-item')).toContainText('document1.txt'); // Contains "test"
    await expect(page.locator('.result-item')).toContainText('code.js'); // Contains "test"
  });

  test('should filter by file types', async ({ page, testDirectory }) => {
    // Set up search parameters
    await page.locator('#directory-input').fill(testDirectory);
    await page.locator('#search-input').fill('test');
    await page.locator('#search-type-content').check();

    // Select file type filter (only .txt files)
    await page.locator('#file-type-select').selectOption('.txt');

    // Start search
    await page.locator('#search-button').click();

    // Wait for search results
    await page.waitForSelector('.search-results', { timeout: 10000 });

    // Check that only .txt files are in results
    const results = page.locator('.result-item');
    const fileNames = await results.allTextContents();

    for (const fileName of fileNames) {
      expect(fileName).toMatch(/\.txt$/);
    }
  });

  test('should display search progress', async ({ page, testDirectory }) => {
    // Set up search parameters
    await page.locator('#directory-input').fill(testDirectory);
    await page.locator('#search-input').fill('test');
    await page.locator('#search-type-content').check();

    // Start search
    await page.locator('#search-button').click();

    // Check that progress indicator appears
    await expect(page.locator('.progress-indicator')).toBeVisible();

    // Wait for search to complete
    await page.waitForSelector('.search-complete', { timeout: 10000 });

    // Verify progress indicator is hidden after completion
    await expect(page.locator('.progress-indicator')).toBeHidden();
  });

  test('should handle empty search results', async ({ page, testDirectory }) => {
    // Set up search for non-existent content
    await page.locator('#directory-input').fill(testDirectory);
    await page.locator('#search-input').fill('nonexistentcontent12345');
    await page.locator('#search-type-content').check();

    // Start search
    await page.locator('#search-button').click();

    // Wait for search to complete
    await page.waitForSelector('.search-complete', { timeout: 10000 });

    // Check that "no results" message is displayed
    await expect(page.locator('.no-results')).toBeVisible();
    await expect(page.locator('.no-results')).toContainText('No files found');
  });

  test('should allow opening files', async ({ page, testDirectory }) => {
    // Perform search first
    await page.locator('#directory-input').fill(testDirectory);
    await page.locator('#search-input').fill('document1');
    await page.locator('#search-type-filename').check();
    await page.locator('#search-button').click();

    // Wait for results
    await page.waitForSelector('.search-results', { timeout: 10000 });

    // Click on a file to open it
    const firstResult = page.locator('.result-item').first();
    const openButton = firstResult.locator('.open-file-button');

    await expect(openButton).toBeVisible();
    // Note: We can't easily test actual file opening in e2e tests
    // but we can verify the button is clickable
    await expect(openButton).toBeEnabled();
  });

  test('should allow revealing files in explorer', async ({ page, testDirectory }) => {
    // Perform search first
    await page.locator('#directory-input').fill(testDirectory);
    await page.locator('#search-input').fill('document1');
    await page.locator('#search-type-filename').check();
    await page.locator('#search-button').click();

    // Wait for results
    await page.waitForSelector('.search-results', { timeout: 10000 });

    // Click on reveal in explorer button
    const firstResult = page.locator('.result-item').first();
    const revealButton = firstResult.locator('.reveal-file-button');

    await expect(revealButton).toBeVisible();
    await expect(revealButton).toBeEnabled();
  });

  test('should stop search when requested', async ({ page, testDirectory }) => {
    // Start a search
    await page.locator('#directory-input').fill(testDirectory);
    await page.locator('#search-input').fill('test');
    await page.locator('#search-type-content').check();
    await page.locator('#search-button').click();

    // Verify search is running
    await expect(page.locator('.progress-indicator')).toBeVisible();

    // Stop the search
    const stopButton = page.locator('#stop-search-button');
    await expect(stopButton).toBeVisible();
    await stopButton.click();

    // Verify search is stopped
    await expect(page.locator('.search-stopped')).toBeVisible();
    await expect(page.locator('.progress-indicator')).toBeHidden();
  });

  test('should handle nested directory search', async ({ page, testDirectory }) => {
    // Search in subdirectories
    await page.locator('#directory-input').fill(testDirectory);
    await page.locator('#search-input').fill('nested');
    await page.locator('#search-type-filename').check();
    await page.locator('#search-button').click();

    // Wait for results
    await page.waitForSelector('.search-results', { timeout: 10000 });

    // Verify nested file is found
    await expect(page.locator('.result-item')).toContainText('nested.txt');

    // Verify the full path shows the subdirectory
    const resultPath = page.locator('.result-item .file-path').first();
    await expect(resultPath).toContainText('subdir');
  });

  test('should persist search history', async ({ page, testDirectory }) => {
    // Perform a search
    await page.locator('#directory-input').fill(testDirectory);
    await page.locator('#search-input').fill('document');
    await page.locator('#search-type-filename').check();
    await page.locator('#search-button').click();

    // Wait for search to complete
    await page.waitForSelector('.search-complete', { timeout: 10000 });

    // Check if search history is available (if implemented)
    const historyDropdown = page.locator('#search-history');
    if (await historyDropdown.isVisible()) {
      await historyDropdown.click();
      await expect(page.locator('.history-item')).toContainText('document');
    }
  });
});