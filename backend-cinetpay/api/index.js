// Importer les modules nécessaires
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app = express();

// Utiliser des middlewares
app.use(cors()); // Active CORS pour autoriser les requêtes de votre site
app.use(bodyParser.json());

// Récupérer les clés depuis les variables d'environnement
const API_KEY = process.env.CINETPAY_APIKEY;
const SITE_ID = process.env.CINETPAY_SITE_ID;

const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2/payment';

// === ROUTE DE DIAGNOSTIC ===
// Sera accessible à https://adasoft.vercel.app/api
app.get('/api', (req, res) => {
    if (API_KEY && SITE_ID) {
        res.status(200).send('Le serveur Adasoft CinetPay est en ligne et les clés API sont chargées.');
    } else {
        res.status(500).send('Erreur: Le serveur est en ligne, mais les variables d\'environnement CINETPAY_APIKEY et/ou CINETPAY_SITE_ID sont manquantes sur Vercel.');
    }
});

// === POINT DE TERMINAISON POUR CRÉER LA TRANSACTION ===
// Sera accessible à https://adasoft.vercel.app/api/create-payment
app.post('/api/create-payment', async (req, res) => {
    if (!API_KEY || !SITE_ID) {
        return res.status(500).json({ error: 'Configuration du serveur incomplète. Clés API manquantes.' });
    }

    try {
        const { amount, currency = 'USD', description = 'Paiement Adasoft' } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'Le montant est requis.' });
        }

        const transaction_id = `TXN-${Date.now()}`;
        const return_url = req.headers.referer ? new URL(req.headers.referer).origin + '/merci.html' : 'https://votre-site.com/merci.html';

        const paymentData = {
            apikey: API_KEY,
            site_id: SITE_ID,
            transaction_id: transaction_id,
            amount: parseInt(amount, 10),
            currency: currency,
            description: description,
            return_url: return_url,
        };
        
        const response = await axios.post(CINETPAY_API_URL, paymentData, {
            headers: { 'Content-Type': 'application/json' }
        });

        const responseData = response.data;
        
        if (responseData.code === '201' && responseData.data) {
            res.status(200).json({ payment_token: responseData.data.payment_token });
        } else {
            res.status(500).json({ error: responseData.description || 'Erreur lors de la création du paiement.' });
        }

    } catch (error) {
        console.error("Erreur interne du serveur :", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Impossible de traiter la demande de paiement.' });
    }
});

// Exporter l'application pour que Vercel puisse l'utiliser
module.exports = app;
