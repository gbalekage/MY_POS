const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store').default;
const axios = require('axios');

const store = new Store();

let mainWindow = null;
let configWindow = null;
let retryWindow = null;

const isDev = true;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        fullscreen: true,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });

    mainWindow.loadURL('http://localhost:5173/');
    mainWindow.on('closed', () => (mainWindow = null));
}

function createConfigWindow() {
    configWindow = new BrowserWindow({
        width: 600,
        height: 400,
        frame: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });

    configWindow.loadURL('http://localhost:5173/config');
    configWindow.on('closed', () => (configWindow = null));
}

// Create the retry connection window
function createRetryWindow() {
    retryWindow = new BrowserWindow({
        width: 600,
        height: 400,
        frame: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });

    retryWindow.loadURL('http://localhost:5173/retry');
    retryWindow.on('closed', () => (retryWindow = null));
}

// Test server connection
async function testServerConnection(url) {
    try {
        const healthUrl = `${url.replace(/\/$/, '')}/api/health`;
        await axios.get(healthUrl, { timeout: 3000 });
        return true;
    } catch {
        return false;
    }
}

// ✅ IPC handlers for user storage
ipcMain.handle('get-store-value', (event, key) => {
    return store.get(key);
});

ipcMain.handle('set-store-value', (event, { key, value }) => {
    store.set(key, value);
    return true;
});

ipcMain.handle('delete-store-key', (event, key) => {
    store.delete(key);
    return true;
});

// App ready logic
app.whenReady().then(async () => {
    const serverUrl = store.get('serverUrl');

    if (!serverUrl) {
        createConfigWindow();
    } else {
        const connected = await testServerConnection(serverUrl);
        if (connected) {
            createMainWindow();
        } else {
            createRetryWindow();
        }
    }
});

// IPC handlers for server connection and config
ipcMain.handle('get-server-url', () => {
    return store.get('serverUrl');
});

ipcMain.on('save-config', (event, url) => {
    store.set('serverUrl', url);
    if (configWindow) {
        configWindow.close();
        configWindow = null;
    }
    createMainWindow();
});

ipcMain.on('retry-connection', async (event) => {
    const serverUrl = store.get('serverUrl');
    const connected = await testServerConnection(serverUrl);
    event.sender.send('connection-status', connected);

    if (connected) {
        if (retryWindow) {
            retryWindow.close();
            retryWindow = null;
        }
        createMainWindow();
    }
});

// IPC handler to close the app
ipcMain.handle('close-app', () => {
    app.quit();
});

// Handle app close
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
