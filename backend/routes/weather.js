const express = require('express');
const axios = require('axios'); // Jangan lupa require axios di sini
const router = express.Router(); // Buat objek router baru

// Endpoint untuk mencari cuaca dan menyimpan riwayat
router.post('/weather', async (req, res) => {
    const { city } = req.body;
    const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
    const pool = req.pool; // Akses pool dari objek req

    if (!city) {
        return res.status(400).json({ message: 'City parameter is required' });
    }

    if (!OPENWEATHER_API_KEY) {
        console.error('OPENWEATHER_API_KEY is not set in .env');
        return res.status(500).json({ message: 'Server API key not configured.' });
    }

    if (!pool) {
        console.error('Database pool is not available in request object.');
        return res.status(500).json({ message: 'Database connection not established.' });
    }

    try {
        // Fetch data cuaca dari OpenWeatherMap API
        const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const weatherResponse = await axios.get(weatherUrl);
        const weatherData = weatherResponse.data;

        // Simpan riwayat pencarian ke database
        const [result] = await pool.execute(
            'INSERT INTO riwayat_cuaca (nama_kota) VALUES (?)',
            [city]
        );
        console.log(`Saved search for ${city} with ID: ${result.insertId}`);

        res.json(weatherData); // Kirim data cuaca kembali ke frontend
    } catch (error) {
        console.error('Error fetching weather or saving history:', error.message);
        if (error.response) {
            console.error('OpenWeatherMap API Error:', error.response.data);
            res.status(error.response.status).json({ message: error.response.data.message || 'Error from OpenWeatherMap API' });
        } else if (error.request) {
            res.status(500).json({ message: 'No response from external weather API.' });
        } else {
            res.status(500).json({ message: 'Server error processing request.' });
        }
    }
});

// Endpoint untuk mendapatkan riwayat pencarian
router.get('/history', async (req, res) => {
    const pool = req.pool; // Akses pool dari objek req

    if (!pool) {
        console.error('Database pool is not available in request object.');
        return res.status(500).json({ message: 'Database connection not established.' });
    }

    try {
        const [rows] = await pool.query('SELECT id, nama_kota, waktu_pencarian FROM riwayat_cuaca ORDER BY waktu_pencarian DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ message: 'Error fetching weather history.' });
    }
});

// NEW: Endpoint untuk menghapus item riwayat pencarian (DELETE)
router.delete('/history/:id', async (req, res) => {
    const { id } = req.params; // Dapatkan ID dari parameter URL
    const pool = req.pool; // Akses pool database dari objek req

    if (!pool) {
        console.error('Database pool is not available in request object.');
        return res.status(500).json({ message: 'Database connection not established.' });
    }

    try {
        const [result] = await pool.execute(
            'DELETE FROM riwayat_cuaca WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            // Jika tidak ada baris yang terpengaruh, berarti item dengan ID tersebut tidak ditemukan
            return res.status(404).json({ message: 'History item not found.' });
        }

        res.json({ message: 'History item deleted successfully.' });
    } catch (error) {
        console.error('Error deleting history item:', error);
        res.status(500).json({ message: 'Error deleting weather history item.' });
    }
});

module.exports = router;
module.exports = router; // Export objek router