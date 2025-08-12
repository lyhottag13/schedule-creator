import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import port from './src/port.js';
import pool from './src/db.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dependencies for the app to read user input and to return JSONs.
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.listen(port, '127.0.0.1', () => {
    console.log(`App running on port ${port}`);
});

// END BOILERPLATE.

app.post('/api/send', async (req, res) => {
    try {
        const { name, age } = req.body;
        await pool.execute('INSERT INTO names (name, age, datetime) VALUES (?, ?, ?)', [name, age, new Date()]);
        return res.status(200).json({});
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({ err });
    }
});

