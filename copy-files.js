const fs = require("fs-extra");
const path = require("path");

const srcDir = path.join(__dirname, "src");
const distDir = path.join(__dirname, "dist");

// Source files are in the root of the src directory
const srcHtml = path.join(srcDir, "index.html");
const srcCss = path.join(srcDir, "index.css");

// Destination directory is dist/presentation/electron-ui
const destUiDir = path.join(distDir, "presentation", "electron-ui");
const destHtml = path.join(destUiDir, "index.html");
const destCss = path.join(destUiDir, "index.css");

async function copyUiFiles() {
  try {
    // Ensure the destination directory exists
    await fs.ensureDir(destUiDir);

    // Copy HTML and CSS files
    await fs.copy(srcHtml, destHtml);
    console.log(`Copied ${srcHtml} to ${destHtml}`);

    await fs.copy(srcCss, destCss);
    console.log(`Copied ${srcCss} to ${destCss}`);
  } catch (err) {
    console.error("Error copying UI files:", err);
    process.exit(1);
  }
}

copyUiFiles();
