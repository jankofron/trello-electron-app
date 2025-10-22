const { contextBridge } = require('electron');

// If you want to inject minimal CSS (e.g., hide Trello header), you can message from here later.
// Keep it empty and safe for now—no Node exposed.
contextBridge.exposeInMainWorld('trelloDesktop', {
  // placeholder for future APIs
});

