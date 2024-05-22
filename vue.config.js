const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pwa: {
    name: 'tarkov-helper',
    themeColor: '#2c3e50',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    manifestOptions: {
      display: 'standalone',
      background_color: '#2c3e50',
      icons: [
        {
          src: 'icon.png',
          sizes: '213x213',
          type: 'image/png'
        }
      ]
    },
  }
})
