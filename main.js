const { app,  BrowserWindow, ipcMain, dialog, shell,Menu} = require('electron');
const path = require('path');
const fs = require('fs');
let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      devTools: true ,
      contextIsolation: true,
      enableRemoteModule: false, 
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.setMenuBarVisibility(false); // メニューを表示するか
  mainWindow.loadFile('index.html');// メインウィンドウに表示するURL

  //メニューを設定
const menu = Menu.buildFromTemplate([
    { role: 'copy' },
    { role: 'paste' },
    { role: 'cut' },
    { role: 'delete' },
    { type: 'separator' },
    { role: 'selectAll' },
    { type: 'separator' },
    {
      label: '表示',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu); // メニューバーとして設定
  // 標準のコンテキストメニューを右クリックに適用
  mainWindow.webContents.on('context-menu', () => {
    menu.popup({ window: mainWindow });
  });

  // 外部リンクを標準ブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' }; 
    }
    return { action: 'allow' };
  });
});

// 全てのウィンドウが閉じたときの処理
app.on("close", (event) => {
  // macOSのとき以外はアプリを終了させます
  if (process.platform !== "darwin") {
    app.quit();
  }
});

//Open file
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'text', extensions: ['md','txt','markdown'] }],
  });

  if (!canceled && filePaths.length > 0) {
    const content = await fs.promises.readFile(filePaths[0], 'utf-8');
    return { content, filePath: filePaths[0] }; // contentとfilePathを返す
  }
  return null;
});

// Save
ipcMain.handle('dialog:saveFile', async (_, { filePath, content }) => {
  fs.writeFileSync(filePath, content, 'utf-8');
});

//Save As
ipcMain.handle('dialog:saveAsFile', async (_, content) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Markdown', extensions: ["txt", "html", "md", "css", "js"] }],
  });

  if (!canceled && filePath) {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return filePath;
  }
  return null;
});
