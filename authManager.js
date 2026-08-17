const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

class AuthManager {
    constructor() {
        this.envPath = path.join(__dirname, '.env');
        this.accessToken = process.env.TOKEN || '';
        this.refreshToken = process.env.REFRESH_TOKEN || '';
    }

    isAccessTokenExpired() {
        if (!this.accessToken) return true;

        try {
            const decoded = jwt.decode(this.accessToken);
            if (!decoded || !decoded.exp) return true;
            return Date.now() >= (decoded.exp * 1000) - 60000;
        } catch {
            return true;
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
        if (!this.refreshToken) {
            throw new Error('REFRESH_TOKEN not found.');
        }

        console.log('🔄 Refresh token is being used...');

        const response = await fetch(
            'https://rollercoin.com/api/auth/refresh',
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Origin': 'https://rollercoin.com'
                },
                body: JSON.stringify({
                    refresh_token: this.refreshToken
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Refresh response:', JSON.stringify(result, null, 2));
            throw new Error(`Refresh failed: HTTP ${response.status}`);
        }

        if (!result.success || !result.data) {
            throw new Error(`Refresh denied: ${result.error || 'Unknown error'}`);
        }

        const newAccessToken = result.data.access_token;
        const newRefreshToken = result.data.refresh_token;

        if (!newAccessToken || !newRefreshToken) {
            throw new Error('Tokens not found in refresh response.');
        }

        this.accessToken = newAccessToken;
        this.refreshToken = newRefreshToken;

        this.updateEnvToken('TOKEN', newAccessToken);
        this.updateEnvToken('REFRESH_TOKEN', newRefreshToken);

        process.env.TOKEN = newAccessToken;
        process.env.REFRESH_TOKEN = newRefreshToken;

        console.log('✅ Access token refreshed.');
        console.log('💾 New tokens saved to .env file.');

        return this.accessToken;
    }

    async getAccessToken() {
        if (this.isAccessTokenExpired()) {
            await this.refresh();
        }
        return this.accessToken;
    }
}

module.exports = AuthManager;