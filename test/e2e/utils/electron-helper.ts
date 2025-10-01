import { test as base, expect, ElectronApplication, Page, _electron as electron } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface ElectronFixtures {
  electronApp: ElectronApplication;
  page: Page;
  testDirectory: string;
}

// Helper function to set directory in tests (bypasses readonly input)
export async function setDirectory(page: Page, directory: string): Promise<void> {
  await page.evaluate((dir) => {
    const input = document.getElementById('directory') as HTMLInputElement;
    if (input) {
      input.value = dir;
      // Trigger input and change events to validate form
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, directory);

  // Wait a bit for form validation
  await page.waitForTimeout(100);
}

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    // Build the app if it hasn't been built yet
    const mainPath = path.join(__dirname, '../../../dist/infrastructure/electron/main-process.js');
    if (!fs.existsSync(mainPath)) {
      throw new Error('App not built. Run "npm run build" first.');
    }

    // Launch Electron app
    const electronApp = await electron.launch({
      args: [mainPath],
      timeout: 30000,
    });

    await use(electronApp);
    await electronApp.close();
  },

  page: async ({ electronApp }, use) => {
    // Get the first window that the app opens
    const page = await electronApp.firstWindow();

    // Wait for the app to load
    await page.waitForLoadState('domcontentloaded');

    await use(page);
  },

  testDirectory: async ({}, use) => {
    // Create a temporary directory for test files
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-search-test-'));

    // Create some test files and directories
    const testFiles = [
      { path: 'document1.txt', content: 'This is a test document with sample content.' },
      { path: 'document2.txt', content: 'Another test file for searching.' },
      { path: 'code.js', content: 'function test() { return "hello world"; }' },
      { path: 'config.json', content: '{"name": "test", "version": "1.0.0"}' },
      { path: 'notes.md', content: '# Test Notes\n\nThis is a markdown file for testing.' },
      { path: 'subdir/nested.txt', content: 'This is a nested file for directory search testing.' },
      { path: 'subdir/data.csv', content: 'name,age,city\nJohn,25,NYC\nJane,30,LA' },
    ];

    // Create directory structure
    fs.mkdirSync(path.join(tempDir, 'subdir'), { recursive: true });

    // Create test files
    for (const file of testFiles) {
      const filePath = path.join(tempDir, file.path);
      fs.writeFileSync(filePath, file.content, 'utf8');
    }

    // Small delay to ensure files are fully written to disk
    await new Promise(resolve => setTimeout(resolve, 100));

    await use(tempDir);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  },
});

export { expect };