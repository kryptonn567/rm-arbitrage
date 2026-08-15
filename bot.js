require('dotenv').config();
const WebSocket = require('ws');
const zlib = require('zlib');
const express = require('express');
const http = require('http');
const path = require('path');
const AuthManager = require('./authManager');

const WS_URL = process.env.WS_URL;
const PORT = process.env.PORT || 3000;

const auth = new AuthManager();

if (!WS_URL) {
    console.error("❌ HATA: .env dosyasında WS_URL bulunamadı!");
    process.exit(1);
}

// ---------------------------------------------------------
// Load data.json for Item Names & Filenames Mapping
// ---------------------------------------------------------
const fs = require('fs');
const itemNamesMap = {};
const itemFilenamesMap = {};

try {
    const dataJson = JSON.parse(
        fs.readFileSync(
            path.join(__dirname, 'data.json'),
            'utf8'
        )
    );

    dataJson.forEach(item => {
        if (item.id) {
            if (item.name) {
                itemNamesMap[item.id] = item.name;
            }

            if (item.filename) {
                itemFilenamesMap[item.id] = item.filename;
            }
        }
    });

    console.log(
        `ℹ️ data.json başarıyla yüklendi. ${Object.keys(itemNamesMap).length} adet eşya eşleştirildi.`
    );

} catch (err) {
    console.log(
        `⚠️ data.json yüklenemedi (Eşya isimleri yerine ID'ler gösterilecek): ${err.message}`
    );
}

// ---------------------------------------------------------
// Express & WebSocket Server Setup
// ---------------------------------------------------------
const app = express();
const server = http.createServer(app);
const localWss = new WebSocket.Server({ server });

// Memory cache for recent opportunities (max 50)
const opportunitiesHistory = [];

// Serve frontend static build
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Fallback to index.html for SPA routing
app.get(/.*/, (req, res) => {
    res.sendFile(
        path.join(frontendDistPath, 'index.html')
    );
});

// Manage client connections
localWss.on('connection', (ws) => {
    // Send historical scanned arbitrage trades
    ws.send(
        JSON.stringify({
            type: 'history',
            data: opportunitiesHistory
        })
    );
});

// Broadcast utility to send data to all connected browser clients
function broadcastToClients(data) {
    const payload = JSON.stringify(data);

    localWss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// ---------------------------------------------------------
// Remote Crawler WebSocket Logic
// ---------------------------------------------------------
const headers = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',

    'Origin': 'https://rollercoin.com'
};

// ---------------------------------------------------------
// Binary / Smart Scanner ile ham fiyatı yakalama
// ---------------------------------------------------------
function hamFiyatiBul(tradeOffersBase64, rehberFiyat) {
    if (!tradeOffersBase64 || !rehberFiyat) {
        return null;
    }

    try {
        const compressedBuffer = Buffer.from(
            tradeOffersBase64,
            'base64'
        );

        let rawBuffer;

        try {
            rawBuffer = zlib.unzipSync(compressedBuffer);

        } catch (e1) {

            try {
                rawBuffer = zlib.inflateSync(compressedBuffer);

            } catch (e2) {

                rawBuffer = zlib.inflateRawSync(
                    compressedBuffer
                );
            }
        }

        // -------------------------------------------------
        // 1. AŞAMA: MessagePack
        // -------------------------------------------------
        try {
            const msgpack = require('@msgpack/msgpack');

            const decoded = msgpack.decode(rawBuffer);

            if (
                Array.isArray(decoded) &&
                decoded.length > 0
            ) {
                const fiyatlar = decoded
                    .map(d => d.price || d.p || null)
                    .filter(p => p !== null);

                if (fiyatlar.length > 0) {
                    return Math.min(...fiyatlar);
                }

            } else if (
                typeof decoded === 'object' &&
                decoded !== null
            ) {

                if (decoded.price) {
                    return decoded.price;
                }

                if (decoded.p) {
                    return decoded.p;
                }
            }

        } catch (eMsgpack) {
            // Fallback'e geç
        }

        // -------------------------------------------------
        // 2. AŞAMA: 32-bit Big-Endian
        // -------------------------------------------------
        const taramaLimiti = Math.min(
            rawBuffer.length - 4,
            150
        );

        for (
            let i = 0;
            i <= taramaLimiti;
            i++
        ) {

            const beFiyat =
                rawBuffer.readUInt32BE(i);

            if (
                Math.abs(
                    beFiyat - rehberFiyat
                ) <= 50000
            ) {

                return beFiyat;
            }
        }

        return null;

    } catch (error) {
        return null;
    }
}

// ---------------------------------------------------------
// Remote WebSocket Connection
// ---------------------------------------------------------
async function connect() {

    try {

        // -------------------------------------------------
        // Auth Manager'dan güncel access token al
        // -------------------------------------------------
        const token =
            await auth.getAccessToken();

        // Token'ı WS URL'e bağlanma anında yerleştir
        const wsUrl =
            WS_URL.replace('{token}', token);

        console.log(
            `🔗 Uzak sunucuya bağlanılıyor: ${new URL(wsUrl).host}`
        );

        const ws =
            new WebSocket(
                wsUrl,
                { headers }
            );

        // -------------------------------------------------
        // WebSocket OPEN
        // -------------------------------------------------
        ws.on('open', () => {

            console.log(
                '🟢 Arbitraj Botu Aktif, kârlı fırsatlar bekleniyor...'
            );

            console.log(
                `🌐 Site adresi: http://localhost:${PORT}`
            );

            console.log(
                '------------------------------------------------------------------'
            );
        });

        // -------------------------------------------------
        // WebSocket MESSAGE
        // -------------------------------------------------
        ws.on('message', (data) => {

            try {

                const payload =
                    JSON.parse(
                        data.toString()
                    );

                if (
                    payload.cmd ===
                    'marketplace_orders_update'
                ) {

                    const itemData =
                        payload.value;

                    const marketData =
                        itemData.data;

                    // En az 2 emir olmalı
                    if (
                        marketData &&
                        marketData.list &&
                        marketData.list.length >= 2
                    ) {

                        // Index 0:
                        // En ucuz satış
                        const emir0 =
                            marketData.list[0];

                        // Index 1:
                        // Bir üst kademe
                        const emir1 =
                            marketData.list[1];

                        const index1FiyatRlt =
                            emir1.price / 1000000;

                        // Referans satış fiyatı
                        const yeniSatisFiyati =
                            index1FiyatRlt /
                            (1 + 0.05);

                        // İlk fiyat
                        const index0FiyatRlt =
                            emir0.price / 1000000;

                        const miktar =
                            emir0.quantity;

                        // -------------------------------------------------
                        // 1. AŞAMA:
                        // Ön kontrol
                        // -------------------------------------------------
                        const onKontrolKarMarji =
                            (
                                yeniSatisFiyati -
                                index0FiyatRlt
                            ) * miktar;

                        // Kâr yoksa devam etme
                        if (
                            onKontrolKarMarji <= 0
                        ) {
                            return;
                        }

                        // -------------------------------------------------
                        // 2. AŞAMA:
                        // Gerçek ham alış fiyatı
                        // -------------------------------------------------
                        let gercekAlisFiyatiRlt =
                            index0FiyatRlt;

                        if (
                            marketData.tradeOffers
                        ) {

                            const hamBulunan =
                                hamFiyatiBul(
                                    marketData.tradeOffers,
                                    emir0.price
                                );

                            if (hamBulunan) {

                                gercekAlisFiyatiRlt =
                                    hamBulunan / 1000000;
                            }
                        }

                        // -------------------------------------------------
                        // Kesin kâr hesabı
                        // -------------------------------------------------
                        const kesinKarMarji =
                            (
                                yeniSatisFiyati -
                                gercekAlisFiyatiRlt
                            ) * miktar;

                        if (
                            kesinKarMarji > 0
                        ) {

                            const opportunity = {

                                itemId:
                                    itemData.item_id,

                                itemName:
                                    itemNamesMap[
                                        itemData.item_id
                                    ] ||
                                    itemData.item_id,

                                itemFilename:
                                    itemFilenamesMap[
                                        itemData.item_id
                                    ] ||
                                    '',

                                itemType:
                                    itemData.item_type,

                                gercekAlisFiyatiRlt:
                                    gercekAlisFiyatiRlt,

                                yeniSatisFiyati:
                                    yeniSatisFiyati,

                                quantity:
                                    miktar,

                                kesinKarMarji:
                                    kesinKarMarji,

                                timestamp:
                                    Date.now()
                            };

                            // -------------------------------------------------
                            // History
                            // -------------------------------------------------
                            opportunitiesHistory.unshift(
                                opportunity
                            );

                            if (
                                opportunitiesHistory.length >
                                50
                            ) {

                                opportunitiesHistory.pop();
                            }

                            // -------------------------------------------------
                            // Terminal
                            // -------------------------------------------------
                            console.log(
                                `\n🚀 ARBİTRAJ FIRSATI YAKALANDI!`
                            );

                            console.log(
                                `📦 Eşya: ${opportunity.itemName} (${opportunity.itemType})`
                            );

                            console.log(
                                `🏷️ Gerçek Alış Fiyatı : ${opportunity.gercekAlisFiyatiRlt.toFixed(6)} RLT`
                            );

                            console.log(
                                `📈 Hedef Satış Fiyatı : ${opportunity.yeniSatisFiyati.toFixed(6)} RLT (Adet: ${opportunity.quantity})`
                            );

                            console.log(
                                `\x1b[32m💚 NET KÂR MARJI     : +${opportunity.kesinKarMarji.toFixed(6)} RLT\x1b[0m`
                            );

                            console.log(
                                '------------------------------------------------------------------'
                            );

                            // -------------------------------------------------
                            // Frontend'e gönder
                            // -------------------------------------------------
                            broadcastToClients({
                                type: 'opportunity',
                                data: opportunity
                            });
                        }
                    }
                }

            } catch (error) {
                // Gereksiz paketleri/hataları yoksay
            }
        });

        // -------------------------------------------------
        // WebSocket CLOSE
        // -------------------------------------------------
        ws.on('close', () => {

            console.log(
                '🔴 Bağlantı koptu. 5 saniye içinde yeniden bağlanılıyor...'
            );

            setTimeout(
                connect,
                5000
            );
        });

        // -------------------------------------------------
        // WebSocket ERROR
        // -------------------------------------------------
        ws.on('error', (err) => {

            console.error(
                'WebSocket Hatası:',
                err.message
            );
        });

    } catch (error) {

        // Auth veya bağlantı oluşturma hatası
        console.error(
            '❌ Bağlantı/Auth hatası:',
            error.message
        );

        setTimeout(
            connect,
            5000
        );
    }
}

// ---------------------------------------------------------
// Start HTTP/WS server
// ---------------------------------------------------------
server.listen(PORT, () => {

    console.log(
        `🚀 Sunucu başlatıldı: http://localhost:${PORT}`
    );

    connect();
});