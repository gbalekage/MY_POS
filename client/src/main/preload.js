const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        on: (channel, func) => {
            const listener = (event, ...args) => func(event, ...args);
            ipcRenderer.on(channel, listener);
            return () => ipcRenderer.removeListener(channel, listener);
        },
        removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
        invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    }
});
