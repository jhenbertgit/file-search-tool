const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    name: "File Search Tool",
    executableName: "file-search-tool",
    icon: "./assets/icon", // No file extension, Forge will detect appropriate format
    asar: true,
    appBundleId: "com.jhenbert.filesearchtool",
    appCategoryType: "public.app-category.productivity",
    appCopyright: "Copyright © 2025 Jhenbert",
    win32metadata: {
      CompanyName: "Jhenbert",
      FileDescription: "A modern file search application",
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
        authors: "Jhenbert Villamucho",
        exe: "file-search-tool.exe",
        description: "A modern file search application",
        setupExe: "FileSearchToolSetup.exe",
        setupIcon: "./assets/icon.ico",
        noMsi: true,
        loadingGif: "./assets/installer.gif",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
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
        prerelease: false,
        draft: true,
      },
    },
  ],
};
