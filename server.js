const express = require('express');
const cors = require('cors');
const https = require('https');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
app.use(cors());
app.use(express.json());

const BIN_ID = process.env.CLOUD_BIN_ID;
const API_KEY = process.env.CLOUD_API_KEY;
const ADMIN_PASS = process.env.ADMIN_PASS;

// Pomoćna funkcija za poziv ka JSONBin-u preko ugrađenog https modula
function jsonBinRequest(method, path = '', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.jsonbin.io',
            path: `/v3/b/${BIN_ID}${path}`,
            method: method,
            headers: {
                'X-Master-Key': API_KEY
            }
        };

        if (data) {
            options.headers['Content-Type'] = 'application/json';
        }

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(parsed.message || `Status code ${res.statusCode}`));
                    }
                } catch (e) {
                    reject(new Error('Invalid JSON response from JSONBin'));
                }
            });
        });

        req.on('error', (err) => reject(err));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// 1. Ruta za čitanje itema
app.get('/api/items', async (req, res) => {
    try {
        const data = await jsonBinRequest('GET', '/latest');
        res.json(data);
    } catch (err) {
        console.error("Greska pri dobavljanju itema:", err.message);
        res.status(500).json({ error: 'Failed to fetch items', details: err.message });
    }
});

// 2. Ruta za čuvanje itema
app.put('/api/items', async (req, res) => {
    const clientPass = req.headers['x-admin-pass'];
    if (clientPass !== ADMIN_PASS) {
        return res.status(401).json({ error: 'Unauthorized: Wrong password' });
    }

    try {
        const data = await jsonBinRequest('PUT', '', req.body);
        res.json(data);
    } catch (err) {
        console.error("Greska pri čuvanju itema:", err.message);
        res.status(500).json({ error: 'Failed to update items', details: err.message });
    }
});

// 3. Ruta za proveru admin lozinke
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASS) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Wrong password' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));