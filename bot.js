require('dotenv').config();
const WebSocket = require('ws');
const zlib = require('zlib');
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const AuthManager = require('./authManager');

const WS_URL = process.env.WS_URL;
const PORT = process.env.PORT || 3000;
const auth = new AuthManager();

if (!WS_URL) {
    console.error("❌ ERROR: WS_URL not found in .env file!");
    process.exit(1);
}

const itemNamesMap = {};
const itemFilenamesMap = {};

try {
    const dataPath = path.join(__dirname, 'data.json');
    const dataJson = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    let hasChanges = false;

    dataJson.forEach(item => {
        if (item.id) {
            let name = item.name;
            if (name && typeof name === 'string' && name.trim().startsWith('{')) {
                try {
                    name = JSON.parse(name);
                } catch (e) {
                    // Ignore JSON parsing errors
                }
            }

            if (name && typeof name === 'object') {
                item.name = name.en || item.id;
                hasChanges = true;
            }

            if (item.name) {
                itemNamesMap[item.id] = item.name;
            }
            if (item.filename) {
                itemFilenamesMap[item.id] = item.filename;
            }
        }
    });

    if (hasChanges) {
        fs.writeFileSync(dataPath, JSON.stringify(dataJson, null, 2), 'utf8');
        console.log('🧹 Cleaned up localized name entries in data.json');
    }

    console.log(`ℹ️ data.json successfully loaded. ${Object.keys(itemNamesMap).length} items matched.`);
} catch (err) {
    console.log(`⚠️ Failed to load data.json: ${err.message}`);
}

const app = express();
const server = http.createServer(app);
const localWss = new WebSocket.Server({ server });

let totalScannedCount = 0;
let cumulativeProfitSum = 0;

const statsPath = path.join(__dirname, 'stats.json');
try {
    if (fs.existsSync(statsPath)) {
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        totalScannedCount = stats.totalScanned || 0;
        cumulativeProfitSum = stats.cumulativeProfit || 0;
    }
} catch (e) {
    // Ignore error loading stats
}

function saveStats() {
    try {
        fs.writeFileSync(statsPath, JSON.stringify({
            totalScanned: totalScannedCount,
            cumulativeProfit: cumulativeProfitSum
        }, null, 2), 'utf8');
    } catch (e) {
        // Ignore error saving stats
    }
}

const opportunitiesHistory = [];
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');

app.use(express.static(frontendDistPath));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

localWss.on('connection', (ws) => {
    ws.send(
        JSON.stringify({
            type: 'history',
            data: opportunitiesHistory,
            totalScanned: totalScannedCount,
            cumulativeProfit: cumulativeProfitSum
        })
    );
});

function broadcastToClients(data) {
    const payload = JSON.stringify(data);
    localWss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Origin': 'https://rollercoin.com'
};

function findRawPrice(tradeOffersBase64, guidePrice) {
    if (!tradeOffersBase64 || !guidePrice) {
        return null;
    }

    try {
        const compressedBuffer = Buffer.from(tradeOffersBase64, 'base64');
        let rawBuffer;

        try {
            rawBuffer = zlib.unzipSync(compressedBuffer);
        } catch (e1) {
            try {
                rawBuffer = zlib.inflateSync(compressedBuffer);
            } catch (e2) {
                rawBuffer = zlib.inflateRawSync(compressedBuffer);
            }
        }

        try {
            const msgpack = require('@msgpack/msgpack');
            const decoded = msgpack.decode(rawBuffer);

            if (Array.isArray(decoded) && decoded.length > 0) {
                const prices = decoded
                    .map(d => d.price || d.p || null)
                    .filter(p => p !== null);

                if (prices.length > 0) {
                    return Math.min(...prices);
                }
            } else if (typeof decoded === 'object' && decoded !== null) {
                if (decoded.price) return decoded.price;
                if (decoded.p) return decoded.p;
            }
        } catch (eMsgpack) {
            // Ignore msgpack decoding errors
        }

        const scanLimit = Math.min(rawBuffer.length - 4, 150);
        for (let i = 0; i <= scanLimit; i++) {
            const bePrice = rawBuffer.readUInt32BE(i);
            if (Math.abs(bePrice - guidePrice) <= 50000) {
                return bePrice;
            }
        }

        return null;
    } catch (error) {
        return null;
    }
}

async function fetchItemMetadata(itemId, itemType) {
    try {
        const token = await auth.getAccessToken();
        const response = await fetch(`https://rollercoin.com/api/marketplace/item-info?itemId=${itemId}&itemType=${itemType}&currency=RLT`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Cookie': `token=${token}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Origin': 'https://rollercoin.com'
            }
        });

        if (!response.ok) {
            console.error(`❌ RollerCoin API Error (item-info): HTTP status ${response.status} ${response.statusText}`);
            const body = await response.text();
            console.error(`Error body:`, body);
            return null;
        }

        const result = await response.json();
        const itemInfo = result.data || result;

        if (itemInfo && (itemInfo.name || itemInfo.title)) {
            let name = itemInfo.name || itemInfo.title;
            if (typeof name === 'string' && name.trim().startsWith('{')) {
                try {
                    name = JSON.parse(name);
                } catch (e) {
                    // Ignore JSON parsing errors
                }
            }
            if (name && typeof name === 'object') {
                name = name.en || itemId;
            }
            const filename = itemInfo.filename || itemInfo.item_filename || itemInfo.image || '';

            return {
                id: itemId,
                name: name,
                filename: filename
            };
        }
    } catch (e) {
        console.error(`⚠️ Failed to fetch metadata for item ${itemId}:`, e.message);
    }
    return null;
}

async function connect() {
    try {
        const token = await auth.getAccessToken();
        const wsUrl = WS_URL.replace('{token}', token);

        console.log(`🔗 Connecting to remote server: ${new URL(wsUrl).host}`);

        const ws = new WebSocket(wsUrl, { headers });

        ws.on('open', () => {
            console.log('🟢 Arbitrage Bot Active, waiting for profitable opportunities...');
            console.log(`🌐 Site URL: http://localhost:${PORT}`);
            console.log('------------------------------------------------------------------');
        });

        ws.on('message', async (data) => {
            try {
                const payload = JSON.parse(data.toString());

                if (payload.cmd === 'marketplace_orders_update') {
                    const itemData = payload.value;
                    const marketData = itemData.data;

                    if (marketData && marketData.list && marketData.list.length >= 2) {
                        const order0 = marketData.list[0];
                        const order1 = marketData.list[1];

                        const index1PriceRlt = order1.price / 1000000;
                        const newSellingPrice = index1PriceRlt / (1 + 0.05);
                        const index0PriceRlt = order0.price / 1000000;
                        const quantity = order0.quantity;

                        const preCheckProfitMargin = (newSellingPrice - index0PriceRlt) * quantity;
                        if (preCheckProfitMargin <= 0) {
                            return;
                        }

                        const itemId = itemData.item_id;
                        const itemType = itemData.item_type;
                        if (!itemNamesMap[itemId]) {
                            console.log(`🔍 Unknown item detected (${itemId}). Fetching metadata from RollerCoin API...`);
                            const metadata = await fetchItemMetadata(itemId, itemType);
                            if (metadata) {
                                itemNamesMap[itemId] = metadata.name;
                                itemFilenamesMap[itemId] = metadata.filename;

                                try {
                                    const dataPath = path.join(__dirname, 'data.json');
                                    let currentData = [];
                                    if (fs.existsSync(dataPath)) {
                                        currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                                    }
                                    currentData.push(metadata);
                                    fs.writeFileSync(dataPath, JSON.stringify(currentData, null, 2), 'utf8');
                                    console.log(`💾 Saved new item metadata for "${metadata.name}" to data.json`);
                                } catch (err) {
                                    console.error('⚠️ Failed to save new item to data.json:', err.message);
                                }
                            }
                        }

                        let actualBuyPriceRlt = index0PriceRlt;
                        if (marketData.tradeOffers) {
                            const rawFound = findRawPrice(marketData.tradeOffers, order0.price);
                            if (rawFound) {
                                actualBuyPriceRlt = rawFound / 1000000;
                            }
                        }

                        const netProfitMargin = (newSellingPrice - actualBuyPriceRlt) * quantity;

                        if (netProfitMargin > 0) {
                            totalScannedCount++;
                            cumulativeProfitSum += netProfitMargin;
                            saveStats();
                            const opportunity = {
                                itemId: itemData.item_id,
                                itemName: itemNamesMap[itemData.item_id] || itemData.item_id,
                                itemFilename: itemFilenamesMap[itemData.item_id] || '',
                                itemType: itemData.item_type,
                                actualBuyPriceRlt: actualBuyPriceRlt,
                                newSellingPrice: newSellingPrice,
                                quantity: quantity,
                                netProfitMargin: netProfitMargin,
                                timestamp: Date.now()
                            };

                            opportunitiesHistory.unshift(opportunity);

                            if (opportunitiesHistory.length > 50) {
                                opportunitiesHistory.pop();
                            }

                            console.log(`\n🚀 ARBITRAGE OPPORTUNITY DETECTED!`);
                            console.log(`📦 Item: ${opportunity.itemName} (${opportunity.itemType})`);
                            console.log(`🏷️ Actual Buy Price : ${opportunity.actualBuyPriceRlt.toFixed(6)} RLT`);
                            console.log(`📈 Target Selling Price : ${opportunity.newSellingPrice.toFixed(6)} RLT (Qty: ${opportunity.quantity})`);
                            console.log(`\x1b[32m💚 NET PROFIT MARGIN   : +${opportunity.netProfitMargin.toFixed(6)} RLT\x1b[0m`);
                            console.log('------------------------------------------------------------------');

                            broadcastToClients({
                                type: 'opportunity',
                                data: opportunity,
                                totalScanned: totalScannedCount,
                                cumulativeProfit: cumulativeProfitSum
                            });
                        }
                    }
                }
            } catch (error) {
                // Ignore parsing errors
            }
        });

        ws.on('close', () => {
            console.log('🔴 Connection lost. Reconnecting in 5 seconds...');
            setTimeout(connect, 5000);
        });

        ws.on('error', (err) => {
            console.error('WebSocket Error:', err.message);
        });
    } catch (error) {
        console.error('❌ Connection/Auth error:', error.message);
        setTimeout(connect, 5000);
    }
}

server.listen(PORT, () => {
    console.log(`🚀 Server started: http://localhost:${PORT}`);
    connect();
});