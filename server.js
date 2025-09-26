// Importer les dépendances nécessaires
require('dotenv').config(); // Pour gérer les variables d'environnement
const express = require('express');
const axios = require('axios'); // Pour faire des requêtes HTTP
const path = require('path');

// --- Configuration de l'application ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(express.json()); // Pour parser le JSON des requêtes entrantes
// Servir les fichiers statiques (HTML, CSS, JS, images, etc.) du répertoire racine
app.use(express.static(path.join(__dirname)));

// --- Endpoint de l'API CinetPay ---
const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2/payment';

// --- Route pour créer un lien de paiement ---
app.post('/api/payment/initiate', async (req, res) => {
    // Vérification des variables d'environnement
    if (!process.env.CINETPAY_API_KEY || !process.env.CINETPAY_SITE_ID) {
        console.error("Clés CinetPay non configurées dans les variables d'environnement.");
        return res.status(500).json({ message: "Configuration du serveur de paiement incomplète." });
    }

    try {
        const { amount, currency, description } = req.body;
        // Création d'un ID de transaction unique
        const transaction_id = `ADASOFT-${Date.now()}`;

        const paymentData = {
            apikey: process.env.CINETPAY_API_KEY,
            site_id: process.env.CINETPAY_SITE_ID,
            transaction_id,
            amount,
            currency,
            description,
            // L'URL de base sera celle de Vercel
            return_url: `https://${req.get('host')}`,
            notify_url: `https://${req.get('host')}/api/payment/notify`
        };

        const apiResponse = await axios.post(CINETPAY_API_URL, paymentData, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (apiResponse.data.code === '201') {
            res.status(200).json(apiResponse.data.data);
        } else {
            console.warn("Réponse de CinetPay non valide:", apiResponse.data);
            res.status(400).json({ message: apiResponse.data.description || apiResponse.data.message });
        }
    } catch (error) {
        console.error("Erreur lors de l'appel à CinetPay:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Erreur interne lors de la communication avec le service de paiement." });
    }
});

// --- Route de notification (Webhook CinetPay) ---
app.post('/api/payment/notify', (req, res) => {
    console.log('Notification de CinetPay reçue:', req.body);
    // TODO: Mettre à jour la base de données avec le statut de la transaction
    res.status(200).send('Notification traitée');
});

// --- Démarrage du serveur (pour le développement local) ---
// Vercel ignore cette partie et utilise la configuration vercel.json
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`✅ Serveur de développement démarré sur http://localhost:${PORT}`);
    });
}

// Export de l'app pour Vercel
module.exports = app;

