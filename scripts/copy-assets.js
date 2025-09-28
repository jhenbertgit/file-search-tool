const fs = require('fs-extra');

async function copyAssets() {
  try {
    console.log('Copying assets to dist folder...');

    // Ensure dist directory exists
    await fs.ensureDir('./dist');

    // Copy HTML file
    await fs.copy('./src/index.html', './dist/index.html');
    console.log('✓ Copied index.html');

    // Copy styles directory
    if (await fs.pathExists('./src/styles')) {
      await fs.copy('./src/styles', './dist/styles');
      console.log('✓ Copied styles directory');
    }

    // Copy any other static assets (like fonts, images, etc.)
    const assetsDir = './src/assets';
    if (await fs.pathExists(assetsDir)) {
      await fs.copy(assetsDir, './dist/assets');
      console.log('✓ Copied assets directory');
    }

    console.log('Asset copying completed successfully!');
  } catch (error) {
    console.error('Error copying assets:', error);
    process.exit(1);
  }
}

copyAssets();