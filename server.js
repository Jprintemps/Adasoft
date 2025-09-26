// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // <-- Importez le module 'path'
const paymentRoutes = require('./routes/paymentRoutes');

// --- Application Setup ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
// Parse incoming request bodies in a middleware before your handlers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- API Routes ---
// All routes related to payment will be handled by paymentRoutes
app.use('/api/payment', paymentRoutes);

// --- MODIFICATION : Serve Frontend ---
// This will serve the index.html file when someone visits the root URL
// This replaces the old welcome JSON message
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Server Initialization ---
app.listen(PORT, () => {
    console.log(`✅ Server is running successfully on port ${PORT}`);
    console.log(`Access it at http://localhost:${PORT}`);
});

