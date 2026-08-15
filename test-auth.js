require('dotenv').config();

const AuthManager = require('./authManager');

async function test() {
    try {
        const auth = new AuthManager();

        console.log('🔐 Token kontrol ediliyor...');

        const token = await auth.getAccessToken();

        console.log('✅ Access token alındı.');
        console.log('Token uzunluğu:', token.length);

    } catch (error) {
        console.error('❌ AUTH HATASI:', error.message);
    }
}

test();