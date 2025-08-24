const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    name: "File Search Tool",
    executableName: "file-search-tool",
    icon: "./assets/icon",
    asar: true,
    appBundleId: "com.jhenbert.filesearchtool",
    appCategoryType: "public.app-category.productivity",
    appCopyright: "Copyright © 2025 Jhenbert",
    win32metadata: {
      CompanyName: "Jhenbert",
      FileDescription:
        "A high-performance file search tool designed for advanced, real-time indexing and rapid retrieval.",
      OriginalFilename: "FileSearchTool.exe",
      ProductName: "File Search Tool",
      InternalName: "FileSearchTool",
    },
    files: [
      "src/**/*",
      "package.json",
      "assets/**/*",
      "!**/*.map",
      "!src/**/*.test.js",
      "!**/.DS_Store",
    ],
    ignore: [
      /^\/\.vscode/,
      /^\/\.git/,
      /^\/dist/,
      /^\/out/,
      /^\/\.eslintrc/,
      /^\/forge\.config\.js/,
      /\.map$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "file-search-tool",
        authors: "Jhenbert Villamucho",
        exe: "file-search-tool.exe",
        description:
          "A high-performance file search tool designed for advanced, real-time indexing and rapid retrieval.",
        setupExe: "FileSearchToolSetup.exe",
        setupIcon: "./assets/icon.ico",
        noMsi: true,
        loadingGif: "./assets/installer.gif",
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: "File Search Tool",
        iconUrl:
          "https://raw.githubusercontent.com/jhenbertgit/file-search-tool/main/assets/icon.ico",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["win32"],
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "jhenbertgit",
          name: "file-search-tool",
        },
        prerelease: true,
        draft: false,
      },
    },
  ],
};
