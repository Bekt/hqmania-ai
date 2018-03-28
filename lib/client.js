const EventEmitter = require('events').EventEmitter;
const axios = require('axios');
const util = require('./util');


const log = util.log;

const defaults = {
    USER_AGENT: 'okhttp/3.8.0',
    HQ_CLIENT: 'Android/1.3.1'
};


class HqClient extends EventEmitter {
    static get HQ_ENDPOINT() { return 'https://ws-quiz.hype.space' };

    constructor(token, options) {
        super();
        this.token = token;
        this.headers = {
            Authorization: `Bearer ${this.token}`,
            Connection: 'Keep-Alive',
            'User-Agent': defaults.USER_AGENT,
            'x-hq-client': defaults.HQ_CLIENT
        };
    }

    getMe() {
        return this._get(`${HqClient.HQ_ENDPOINT}/users/me`);
    }

    getGame() {
        let config = { headers: { Authorization: null } };
        return this._get(`${HqClient.HQ_ENDPOINT}/shows/now?type=hq`, config);
    }

    async joinGame() {
        let game = await this.getGame();
        if (!game.active) {
            log('No live game right now. Next game at:', (new Date(game.nextShowTime)).toString());
            return;
        }
        let user = await this.getMe();
        log(`Logged in with user ${user.username}`);
        if (user.blocked) {
            log('User is blocked: ', user);
            return;
        }
        let socketUrl = game.broadcast.socketUrl;
        this._connectWs(socketUrl);
    }

    async handleMessage(message) {
        let ignore = [
            'interaction', 'broadcastStats', 'questionClosed',
            'questionFinished', 'gameSummary', 'kicked'
        ];
        let t = message.type;
        if (ignore.includes(t)) {
            return;
        };
        if (t === 'broadcastEnded') {
            log('Broadcast ended.');
            this.emit('broadcastEnded');
            return;
        };
        if (t === 'questionSummary') {
            log(message);
            return;
        }
        if (t === 'question') {
            log(message);
            this.emit('question', message);
            return;
        }
        // Unknown message type.
        log(message);
    }

    async _connectWs(url, options = {}) {
        options = {
            retries: (options.retries || 0) + 1,
            headers: this.headers,
            ...options
        }
        let ws = new websocket(url, options);
        ws.on('open', () => log('Connected to broadcast.'));
        ws.on('error', (err) => log('Error', err));
        ws.on('close', async (code, reason) => {
            log('Socket closed. Reconnecting...', code, reason);
            await util.sleep(10);
            return this._connectWs(url, options);
        });
        ws.on('message', (data) => {
            this.handleMessage(JSON.parse(data));
        });
        return ws;
    }

    _get(url, config = {}) {
        return this._request(url, { ...config, method: 'GET' });
    }

    _post(url, config = {}) {
        return this._request(url, { ...config, method: 'POST' });
    }

    async _request(url, config = {}) {
        config = { ...config, headers: { ...this.headers, ...config.headers } };
        try {
            return (await axios.request(url, config)).data;
        } catch (err) {
            log(err.response);
            throw new Error(err.response);
        }
    }
}


module.exports = HqClient;
