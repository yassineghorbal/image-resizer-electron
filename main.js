const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')
const resizeImg = require('resize-img')

isDev = process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin'

let mainWindow

// create the maion window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev ? 1000 : 500,
        height: 600,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        resizable: isDev,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    // open devtools if in dev env
    if (isDev) {
        mainWindow.webContents.openDevTools()
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'))
}

// create about window
function createAboutWindow() {
    const aboutWindow = new BrowserWindow({
        title: 'About Image Resizer',
        width: 300,
        height: 300
    })

    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'))
}

// app is ready
app.whenReady().then(() => {
    createMainWindow()

    // implement menu
    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)

    // remove mainWindow from memory on close
    mainWindow.on('close', () => mainWindow = null)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    })
})

// menu template
const menu = [
    ...(isMac ? [
        {
            label: app.name,
            submenu: [
                {
                    label: 'About'
                }
            ]
        }
    ] : []),
    {
        role: 'fileMenu'
    },
    ...(!isMac ? [
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow,
                }
            ]
        }
    ] : []),
];

// respond to ipcRenderer resize
ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageresizer')
    resizeImage(options)
})

// resize the image
async function resizeImage({ imagePath, width, height, dest }) {
    try {
        // Resize image
        const newPath = await resizeImg(fs.readFileSync(imagePath), {
            width: +width,
            height: +height,
        });


        // create filename
        const filename = path.basename(imagePath)

        // create dest folder if it doesnt exist
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest)
        }

        // write file to dest folder
        fs.writeFileSync(path.join(dest, filename), newPath)

        // send success message
        mainWindow.webContents.send('image:done')

        // open dest folder
        shell.openPath(dest)
    } catch (err) {
        console.log(err)
    }
}


app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit()
    }
})