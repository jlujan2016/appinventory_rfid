const net = require('net');
const { Commands } = require('./nodejs-uhf-commands/commands');

class RFIDService {
    constructor() {
        this.client = null;
    }

    connect() {
        this.client = new net.Socket();

        this.client.connect(8888, '192.168.1.180', () => {
            console.log('✅ Conectado al lector RFID');
        });

        this.client.on('error', (err) => {
            console.log('❌ Error conexión RFID:', err.message);
        });

        this.client.on('close', () => {
            console.log('🔌 RFID desconectado');
        });

        this.client.on('data', (data) => {
            console.log('📡 DATA RAW:', data.toString('hex').toUpperCase());
            
            setTimeout(() => {
                console.log('🚀 Iniciando lectura RFID real...');
                const cmd = Commands.startInventoryUR4();
                console.log('📡 CMD:', cmd.toString('hex').toUpperCase());
                this.client.write(cmd);
            }, 1000);


        });
    }
}

module.exports = new RFIDService();