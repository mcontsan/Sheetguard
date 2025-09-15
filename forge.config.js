const { VitePlugin } = require('@electron-forge/plugin-vite');

module.exports = {
  // ... outras configurações ...
  plugins: [
    new VitePlugin({
      // Configuração para o 'build' final
      build: [
        {
          entry: 'src/main.js', // ou o ponto de entrada principal
          config: 'vite.main.config.mjs',
        },
      ],
      // Configuração para o 'renderer' (a interface)
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mjs',
        },
      ],
    }),
  ],
};