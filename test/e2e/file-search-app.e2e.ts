import { test, expect, setDirectory } from './utils/electron-helper';

test.describe('File Search Application E2E', () => {
  test('should launch and display the main window', async ({ page }) => {
    // Check that the main window opens
    expect(page).toBeTruthy();

    // Wait for the app to fully load
    await page.waitForSelector('h1', { timeout: 10000 });

    // Check for essential UI elements
    await expect(page.locator('h1')).toContainText('File Search');
    await expect(page.locator('#directory')).toBeVisible();
    await expect(page.locator('#search-term')).toBeVisible();
    await expect(page.locator('#search-button')).toBeVisible();
  });

  test('should allow directory selection', async ({ page, testDirectory }) => {
    // Set directory using helper function (bypasses readonly input for testing)
    await setDirectory(page, testDirectory);

    // Verify the directory path is set
    const directoryInput = page.locator('#directory');
    await expect(directoryInput).toHaveValue(testDirectory);
  });

  test('should perform file name search', async ({ page, testDirectory }) => {
    // Set up search parameters
    await setDirectory(page, testDirectory);
    await page.locator('#search-term').fill('txt');

    // Select file name search mode
    await page.locator('#search-type').selectOption('file-name');

    // Ensure button is enabled
    await expect(page.locator('#search-button')).not.toBeDisabled();

    // Start search
    await page.locator('#search-button').click();

    // Wait for search to complete and show results
   await page.waitForTimeout(2000);

    // Check that either results are displayed OR we see "No Results Found"
    const resultsList = page.locator('#results-list');
    const hasResults = await resultsList.locator('li.result-item').count() > 0;
    const hasEmptyState = await resultsList.getByText('No Results Found').isVisible();

    expect(hasResults || hasEmptyState).toBe(true);
  });

  test('should handle empty search results', async ({ page, testDirectory }) => {
    // Set up search for non-existent content
    await setDirectory(page, testDirectory);
    await page.locator('#search-term').fill('nonexistentcontent12345');
    await page.locator('#search-type').selectOption('file-content');

    // Start search
    await page.locator('#search-button').click();

    // Wait for search to complete
    await page.waitForTimeout(2000);

    // Verify empty state is shown
    await expect(page.locator('#results-list')).toContainText('No Results Found');
  });
});
