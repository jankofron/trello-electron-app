const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');

const BOARD_URL = 'https://trello.com/login'
const PARTITION = 'persist:trello-board';

const Store = require('electron-store').default;
const store = new Store();

let win, tray, saveTimer;

function isTrelloBoardUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.hostname === 'trello.com' && u.pathname.startsWith('/b/');
  } catch {
    return false;
  }
}

function saveBoardUrl(url) {
  if (!isTrelloBoardUrl(url)) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    store.set('lastBoardUrl', url);
  }, 200); // small debounce for SPA churn
}

function createWindow() {
  const { width, height, x, y } = store.get('windowBounds', {
    width: 1200,
    height: 800
  });
  
  win = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 200,
    minHeight: 400,
    show: false,
    icon: path.join(__dirname, 'assets/icons/icon.png'),
    webPreferences: {
      // Keep the site sandboxed; use preload for anything you need
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      partition: PARTITION
    }
  });
  
  win.setMenu(null);

  // Open external links in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Allow Trello’s own auth popups; open everything else externally
    const allow = url.startsWith('https://trello.com') || url.includes('auth');
    if (!allow) shell.openExternal(url);
    return { action: allow ? 'allow' : 'deny' };
  });

  // Optional: tweak UA if Trello serves odd variants
  // const ua = win.webContents.getUserAgent() + ' TrelloDesktop/0.1';
  // win.webContents.setUserAgent(ua);

  const startUrl = store.get('lastBoardUrl') || BOARD_URL;
  win.loadURL(startUrl);
  win.once('ready-to-show', () => win.show());

 // Save size and position on move or resize
  win.on('resize', saveBounds);
  win.on('move', saveBounds);



  win.webContents.on('did-navigate', (_event, url) => saveBoardUrl(url));

  // In-page navigations (SPA: hash/router changes)
  win.webContents.on('did-navigate-in-page', (_event, url) => saveBoardUrl(url));

  // On close, persist whatever’s currently shown (handles last-second changes)
  win.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
    }
    const url = win?.webContents?.getURL?.();
    if (url) saveBoardUrl(url);
  });


  function saveBounds() {
    if (!win.isMinimized() && !win.isMaximized()) {
      store.set('windowBounds', win.getBounds());
    }
  }
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/icons/icon.png'));
  tray = new Tray(icon);

  const menu = Menu.buildFromTemplate([
    { label: 'Show', click: () => { win.show(); win.focus(); } },
    { label: 'Hide', click: () => win.hide() },
    { type: 'separator' },
    { label: 'Reload', click: () => win.webContents.reload() },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } }
  ]);
  tray.setToolTip('Trello Board');
  tray.setContextMenu(menu);

  tray.on('click', () => {
    if (!win) return;
    if (win.isVisible()) win.hide(); else { win.show(); win.focus(); }
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on('second-instance', () => {
    if (win) { win.show(); win.focus(); }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
}

app.on('window-all-closed', () => {
  // On Linux we keep running in tray; don’t quit
  // If you want to quit when last window is closed: app.quit();
});

