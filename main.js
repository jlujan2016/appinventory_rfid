const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sql = require('mssql');
require("dotenv").config();
const dotenv = require('dotenv');
const rfidService = require('./rfidService');

// Determinar el entorno
const envPath = app.isPackaged 
  ? path.join(__dirname, '.env.production') 
  : path.join(__dirname, '.env.development');

// Cargar las variables de entorno
dotenv.config({ path: envPath });

let mainWindow;
let dashboardWindow; // Ventana del dashboard

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_HOST, // Puede ser 'localhost' o una IP
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Si usas Azure
        trustServerCertificate: true, // Si usas un certificado autofirmado
    },
};

async function connectToDatabase() {
    try {
        await sql.connect(config);
        console.log('Conectado a SQL Server');
    } catch (err) {
        console.error('Error al conectar a SQL Server:', err);
    }
}

ipcMain.handle('login', async (event, username, password) => {
    try {
        const request = new sql.Request();
        const query = `SELECT * FROM Users WHERE username = '${username}' AND password_hash = CONVERT(NVARCHAR(32),HashBytes('MD5', '${password}'),2)`;
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            // Cerrar la ventana de login
            if (mainWindow) {
                mainWindow.close();
            }

            // Abrir la ventana del dashboard
            dashboardWindow = new BrowserWindow({
                width: 1000,
                height: 700,
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'), // 🔥 FALTABA ESTO
                    contextIsolation: true,
                    enableRemoteModule: false,
                },
            });

            dashboardWindow.loadFile('rfid.html');

            dashboardWindow.on('closed', () => {
                dashboardWindow = null;
            });

            return 'Login exitoso';
        } else {
            return 'Usuario o contraseña incorrectos';
        }
    } catch (err) {
        console.error('Error al ejecutar la consulta:', err);
        const { dialog } = require('electron');
        dialog.showErrorBox('Error', err.message);
        
        return 'Error en el servidor';
        alert("error");
        alert(err);

    }
});


ipcMain.handle('dashboard-data', async () => {
    try {
        const request = new sql.Request();

        const query = `
            SELECT 
                CATEGORIA ,
                COUNT(item ) AS TotalProductos
            FROM EQUIPOS_GLEF 
            GROUP BY CATEGORIA
        `;

        const result = await request.query(query);
        return result.recordset;

    } catch (err) {
        console.error(err);
        return [];
    }
});

ipcMain.handle('open-rfid-window', async () => {
    let rfidWindow = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    rfidWindow.loadFile('rfid.html');

    rfidWindow.on('closed', () => {
        rfidWindow = null;
    });

    return true;
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    connectToDatabase();
    createWindow();
    // 🔥 AQUÍ VA RFID
    rfidService.connect();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

app.on('quit', () => {
    sql.close();
});