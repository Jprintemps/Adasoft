// --- Import des modules ---
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

// --- Initialisation du serveur ---
const app = express();
app.use(cors()); // Autorise les requêtes depuis votre site
app.use(express.json());

// --- Récupération sécurisée des clés ---
const API_KEY = process.env.CINETPAY_API_KEY;
const SITE_ID = process.env.CINETPAY_SITE_ID;
const API_URL = "https://api-checkout.cinetpay.com/v2/payment";

// --- Route pour initier le paiement ---
app.post('/api/initier-paiement', async (req, res) => {
    // Vérification que les clés sont bien configurées
    if (!API_KEY || !SITE_ID) {
        return res.status(500).json({ error: "Les clés API CinetPay ne sont pas configurées sur le serveur." });
    }

    try {
        const { amount, description } = req.body;
        const currency = 'USD'; // Votre site affiche les prix en USD

        if (!amount || !description) {
            return res.status(400).json({ error: "Le montant et la description sont requis." });
        }
        
        const transaction_id = `ADASOFT-${Date.now()}`;

        const paymentData = {
            apikey: API_KEY,
            site_id: SITE_ID,
            transaction_id: transaction_id,
            amount: parseInt(amount, 10),
            currency: currency,
            description: description,
            // Remplacer par les vraies URLs de votre site après déploiement
            return_url: "https://adasoft.vercel.app/merci",
            notify_url: `https://${process.env.VERCEL_URL}/api/notification`,
        };
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData),
        });

        const data = await response.json();

        if (data.code === '201') {
            res.status(200).json({ payment_url: data.data.payment_url });
        } else {
            res.status(400).json({ error: data.description || data.message });
        }

    } catch (error) {
        res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

// --- Route pour les notifications CinetPay ---
app.post('/api/notification', (req, res) => {
    // C'est ici que CinetPay confirme le statut du paiement.
    // Vous pouvez ajouter du code pour mettre à jour une base de données.
    console.log("Notification CinetPay reçue:", req.body);
    res.status(200).send('OK');
});

// Exporte l'app pour Vercel
module.exports = app;
