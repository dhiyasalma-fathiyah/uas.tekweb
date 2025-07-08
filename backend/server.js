require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Using promise-based version for async/await
const weatherRoutes = require('./routes/weatherRoutes'); // Import the weather routes

const app = express();
const port = 3000; // Port untuk backend

// Middleware
app.use(cors()); // Izinkan permintaan lintas asal dari frontend
app.use(express.json()); // Untuk mengurai JSON request bodies

// Database connection pool
let pool;
async function connectToDatabase() {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        console.log('Connected to MySQL database');
    } catch (error) {
        console.error('Failed to connect to MySQL database:', error);
        process.exit(1); // Keluar dari proses jika gagal koneksi DB
    }
}
connectToDatabase();

// Middleware untuk melampirkan pool database ke objek request
app.use((req, res, next) => {
    req.pool = pool;
    next();
});

// Gunakan rute cuaca, dengan awalan /api
app.use('/api', weatherRoutes);

// Rute dasar untuk memastikan server berjalan
app.get('/', (req, res) => {
    res.send('Weather App Backend is running!');
});

// Mulai server
app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});