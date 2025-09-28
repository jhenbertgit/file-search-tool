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
      CompanyName: "Webgenix",
      FileDescription:
        "A high-performance file search tool designed for advanced, real-time indexing and rapid retrieval.",
      OriginalFilename: "FileSearchTool.exe",
      ProductName: "File Search Tool",
      InternalName: "FileSearchTool",
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "file-search-tool",
        authors: "Jhenbert",
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
        setupExe: "FileSearchToolSetup.exe",
        iconUrl:
          "https://raw.githubusercontent.com/jhenbertgit/file-search-tool/main/assets/icon.ico",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["win32"],
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "File Search Tool",
        title: "File Search Tool Installer",
        icon: "./assets/icon.icns",
        background: "./assets/dmg-background.png",
        format: "ULFO",
        window: {
          size: {
            width: 660,
            height: 400,
          },
        },
        contents: [
          {
            x: 180,
            y: 170,
            type: "file",
            path: "File Search Tool.app",
          },
          {
            x: 480,
            y: 170,
            type: "link",
            path: "/Applications",
          },
        ],
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        name: "file-search-tool",
        productName: "File Search Tool",
        genericName: "File Search Tool",
        description:
          "A high-performance file search tool designed for advanced, real-time indexing and rapid retrieval.",
        maintainer: "Jhenbert",
        homepage: "https://github.com/jhenbertgit/file-search-tool",
        categories: ["Utility", "FileManager"],
        icon: "./assets/icon.png",
        section: "utils",
        priority: "optional",
        depends: [],
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        name: "file-search-tool",
        productName: "File Search Tool",
        description:
          "A high-performance file search tool designed for advanced, real-time indexing and rapid retrieval.",
        maintainer: "Jhenbert",
        homepage: "https://github.com/jhenbertgit/file-search-tool",
        categories: ["Utility", "FileManager"],
        icon: "./assets/icon.png",
        license: "MIT",
        requires: [],
      },
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
