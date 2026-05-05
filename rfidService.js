const net = require('net');

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
    }
}

module.exports = new RFIDService();