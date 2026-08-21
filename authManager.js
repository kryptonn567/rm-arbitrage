const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

class AuthManager {
    constructor() {
        this.envPath = path.join(__dirname, '.env');

        this.accessToken = process.env.TOKEN || '';
        this.refreshToken = process.env.REFRESH_TOKEN || '';

        this.refreshPromise = null;
    }

    isAccessTokenExpired() {
        if (!this.accessToken) {
            return true;
        }

        try {
            const decoded = jwt.decode(this.accessToken);

            if (!decoded || !decoded.exp) {
                return true;
            }

            return Date.now() >= (decoded.exp * 1000) - 60000;
        } catch {
            return true;
        }
    }

    getTokenExpiration() {
        if (!this.accessToken) {
            return null;
        }

        try {
            const decoded = jwt.decode(this.accessToken);

            if (!decoded || !decoded.exp) {
                return null;
            }

            return decoded.exp * 1000;
        } catch {
            return null;
        }
    }

    updateEnvToken(name, value) {
        let env = fs.readFileSync(this.envPath, 'utf8');

        const regex = new RegExp(`^${name}=.*$`, 'm');

        if (regex.test(env)) {
            env = env.replace(regex, `${name}=${value}`);
        } else {
            env += `\n${name}=${value}`;
        }

        fs.writeFileSync(this.envPath, env, 'utf8');
    }

    async refresh() {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this._refresh();

        try {
            return await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
        }
    }

    async _refresh() {
        if (!this.refreshToken) {
            throw new Error('REFRESH_TOKEN not found.');
        }

        console.log('🔄 Refresh token is being used...');

        let response;

        try {
            response = await fetch(
                'https://rollercoin.com/api/auth/refresh',
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Origin': 'https://rollercoin.com',
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36'
                    },
                    body: JSON.stringify({
                        refresh_token: this.refreshToken
                    })
                }
            );
        } catch (error) {
            throw new Error(
                `Refresh request failed: ${error.message}`
            );
        }

        const responseText = await response.text();

        let result;

        try {
            result = JSON.parse(responseText);
        } catch {
            console.error(
                `❌ Refresh endpoint JSON yerine farklı bir response döndürdü. HTTP ${response.status}`
            );

            console.error(
                `❌ Response: ${responseText.slice(0, 300)}`
            );

            throw new Error(
                `Refresh endpoint returned non-JSON response (HTTP ${response.status})`
            );
        }

        if (!response.ok) {
            console.error(
                '❌ Refresh response:',
                JSON.stringify(result, null, 2)
            );

            throw new Error(
                `Refresh failed: HTTP ${response.status} - ${result.error || 'Unknown error'}`
            );
        }

        if (!result.success || !result.data) {
            throw new Error(
                `Refresh denied: ${result.error || 'Unknown error'}`
            );
        }

        const newAccessToken = result.data.access_token;
        const newRefreshToken = result.data.refresh_token;

        if (!newAccessToken || !newRefreshToken) {
            throw new Error(
                'Tokens not found in refresh response.'
            );
        }

        this.accessToken = newAccessToken;
        this.refreshToken = newRefreshToken;

        this.updateEnvToken(
            'TOKEN',
            newAccessToken
        );

        this.updateEnvToken(
            'REFRESH_TOKEN',
            newRefreshToken
        );

        process.env.TOKEN = newAccessToken;
        process.env.REFRESH_TOKEN = newRefreshToken;

        const expiration = this.getTokenExpiration();

        console.log('✅ Access token refreshed.');

        if (expiration) {
            console.log(
                `⏰ New token expires: ${new Date(expiration).toISOString()}`
            );
        }

        console.log(
            '💾 New tokens saved to .env file.'
        );

        return this.accessToken;
    }

    async getAccessToken() {
        if (this.isAccessTokenExpired()) {
            return await this.refresh();
        }

        return this.accessToken;
    }
}

module.exports = AuthManager;