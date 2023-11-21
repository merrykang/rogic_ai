const { app, BrowserWindow } = require('electron');
const path = require('path');
 
const createWindow = () => {
    const win = new BrowserWindow({
        // width: 640,
        //height: 480,
        webPreferences: { 
            preload: path.join(__dirname, 'detector-face.js'),
            nodeIntegration: true,
            contextIsolation: false,
            //enableRemoteModule: true, 
        }
    });
 
    win.loadFile('./index.html');
};
 
app.whenReady().then(() => {
    createWindow();
 
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});
 
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});