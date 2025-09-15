// main.js

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Lógica de carregamento corrigida e robusta
  if (!app.isPackaged) {
    // Se não estivermos em modo de produção (ou seja, a correr com 'npm run start'),
    // carrega a URL do servidor de desenvolvimento do Vite.
    win.loadURL('http://localhost:5173');
    // Abre as Ferramentas de Desenvolvedor automaticamente em modo de desenvolvimento.
    win.webContents.openDevTools();
  } else {
    // Se a aplicação estiver empacotada, carrega o ficheiro 'index.html' da build.
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- PONTE PARA GUARDAR FICHEIROS (sem alterações) ---

ipcMain.handle('show-save-dialog', async (event, options) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  const result = await dialog.showSaveDialog(focusedWindow, options);
  return result;
});

ipcMain.handle('save-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Falha ao guardar o ficheiro:', error);
    return { success: false, error: error.message };
  }
});