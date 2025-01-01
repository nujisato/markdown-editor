const { app,  BrowserWindow, ipcMain, dialog, shell, menu} = require('electron');
const path = require('path');
const fs = require('fs');
let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      devTools: true , //デベロッパーツールの起動を許可する
      contextIsolation: true,
      enableRemoteModule: true, //remoteを有効にするため
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.setMenuBarVisibility(true); // メニューを表示するか
  mainWindow.loadFile('index.html');// メインウィンドウに表示するURL

  // 外部リンクを標準ブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url); // 標準ブラウザでURLを開く
      return { action: 'deny' }; // Electronで新しいウィンドウを開かない
    }
    return { action: 'allow' };
  });
});


// 全てのウィンドウが閉じたときの処理
app.on("close", (event) => {
  // macOSのとき以外はアプリを終了させます
  if (process.platform !== "darwin") {
    // アプリ終了
    app.quit();
  }
});

//ファイルを開く
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'text', extensions: ['md','txt','html','css','js'] }],
  });

  if (!canceled && filePaths.length > 0) {
    const content = await fs.promises.readFile(filePaths[0], 'utf-8');
    return { content, filePath: filePaths[0] }; // contentとfilePathを返す
  }
  return null;
});

// ファイルを上書き保存する処理
ipcMain.handle('dialog:saveFile', async (_, { filePath, content }) => {
  fs.writeFileSync(filePath, content, 'utf-8');
});

//ファイルを保存
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
