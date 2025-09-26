// Importer les dépendances nécessaires
require('dotenv').config();
const express = require('express');
const axios = require('axios');

// --- Configuration de l'application ---
const app = express();
app.use(express.json()); // Middleware pour parser le JSON

// --- Endpoint de l'API CinetPay ---
const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2/payment';

// --- Route pour créer un lien de paiement ---
// Vercel va automatiquement mapper ce fichier à la route /api
app.post('/api/payment/initiate', async (req, res) => {
    if (!process.env.CINETPAY_API_KEY || !process.env.CINETPAY_SITE_ID) {
        console.error("Clés CinetPay non configurées.");
        return res.status(500).json({ message: "Configuration du serveur de paiement incomplète." });
    }

    try {
        const { amount, currency, description } = req.body;
        const transaction_id = `ADASOFT-${Date.now()}`;

        const paymentData = {
            apikey: process.env.CINETPAY_API_KEY,
            site_id: process.env.CINETPAY_SITE_ID,
            transaction_id,
            amount,
            currency,
            description,
            return_url: `https://${req.get('host')}`,
            notify_url: `https://${req.get('host')}/api/payment/notify`
        };

        const apiResponse = await axios.post(CINETPAY_API_URL, paymentData, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (apiResponse.data.code === '201') {
            res.status(200).json(apiResponse.data.data);
        } else {
            res.status(400).json({ message: apiResponse.data.description || apiResponse.data.message });
        }
    } catch (error) {
        console.error("Erreur CinetPay:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Erreur interne du service de paiement." });
    }
});

// --- Route de notification ---
app.post('/api/payment/notify', (req, res) => {
    console.log('Notification reçue:', req.body);
    res.status(200).send('OK');
});

// Export de l'app pour Vercel

require('dotenv').config();
const express = require('express');
const paymentRoutes = require('./routes/paymentRoutes');
// Middleware pour parser le JSON
app.use(express.json());

// Indiquer à Express d'utiliser le routeur pour les URLs /api/payment/*
app.use('/api/payment', paymentRoutes);

// Exporter l'application pour que Vercel puisse l'utiliser
module.exports = app;