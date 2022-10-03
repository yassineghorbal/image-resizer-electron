const { app, BrowserWindow } = require('electron')

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: 500,
        height: 600
    })

    mainWindow.loadFile()
}