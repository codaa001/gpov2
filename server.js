const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Podaci se uzimaju iz bezbednog .env fajla
const BIN_ID = process.env.CLOUD_BIN_ID;
const API_KEY = process.env.CLOUD_API_KEY;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;

// 1. Ruta za čitanje itema (javna)
app.get('/api/items', async (req, res) => {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': API_KEY }
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// 2. Ruta za čuvanje itema (samo sa tačnom admin lozinkom)
app.put('/api/items', async (req, res) => {
    const clientPass = req.headers['x-admin-pass'];
    if (clientPass !== ADMIN_PASS) {
        return res.status(401).json({ error: 'Unauthorized: Wrong password' });
    }

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update items' });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));