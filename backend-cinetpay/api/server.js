// Importer les modules nécessaires
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // Pour faire des requêtes HTTP à CinetPay
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement depuis le fichier .env (pour le développement local)
dotenv.config();

// Créer l'application Express
const app = express();
// Vercel gère le port, mais on le définit pour le local
const port = process.env.PORT || 3000;

// Utiliser des middlewares
app.use(bodyParser.json()); // Pour parser le corps des requêtes en JSON
app.use(express.static('public')); // Pour servir les fichiers statiques (notre HTML)

// Récupérer les clés depuis les variables d'environnement
const API_KEY = process.env.CINETPAY_APIKEY;
const SITE_ID = process.env.CINETPAY_SITE_ID;
// On récupère l'URL de base du déploiement Vercel. Pour le développement local, on définit une valeur par défaut.
const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${port}`;


if (!API_KEY || !SITE_ID) {
    console.error("Erreur : Les variables d'environnement CINETPAY_APIKEY et CINETPAY_SITE_ID doivent être définies.");
    // En production, il vaut mieux ne pas planter le process, mais Vercel n'exécutera pas la fonction sans les variables.
}

const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2/payment';

// === POINT DE TERMINAISON POUR CRÉER LA TRANSACTION ===
// Le frontend appellera cette route pour initier un paiement.
app.post('/create-payment', async (req, res) => {
    try {
        // Dans une vraie application, vous ne feriez pas confiance au montant envoyé par le client.
        // Vous récupéreriez le produit/service depuis votre base de données pour en connaître le prix réel.
        const { amount, currency = 'XOF', description = 'Test de paiement sécurisé' } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'Le montant est requis.' });
        }

        const transaction_id = `TXN-${Math.floor(Math.random() * 100000000)}`;

        // Préparation des données à envoyer à CinetPay
        const paymentData = {
            apikey: API_KEY,
            site_id: SITE_ID,
            transaction_id: transaction_id,
            amount: parseInt(amount, 10),
            currency: currency,
            description: description,
            // URL de notification DYNAMIQUE que CinetPay appellera pour confirmer le statut
            notify_url: `${BASE_URL}/notify`, 
            // URL DYNAMIQUE où l'utilisateur sera redirigé après le paiement
            return_url: `${BASE_URL}/return`,
             // Données client (peuvent être passées depuis le front ou récupérées de la session)
            customer_name: "Joe",
            customer_surname: "Down",
            customer_email: "down@test.com",
            customer_phone_number: "088767611",
            customer_address: "BP 0024",
            customer_city: "Antananarivo",
            customer_country: "CM",
            customer_state: "CM",
            customer_zip_code: "06510"
        };
        
        console.log("Envoi des données à CinetPay : ", paymentData);

        // Appel à l'API de CinetPay depuis le backend
        const response = await axios.post(CINETPAY_API_URL, paymentData, {
            headers: { 'Content-Type': 'application/json' }
        });

        const responseData = response.data;
        
        if (responseData.code === '201' && responseData.data) {
            res.status(200).json({ payment_token: responseData.data.payment_token });
        } else {
            console.error("Erreur CinetPay :", responseData.description);
            res.status(500).json({ error: responseData.description || 'Une erreur est survenue lors de la création du paiement.' });
        }

    } catch (error) {
        console.error("Erreur interne du serveur :", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Impossible de traiter la demande de paiement.' });
    }
});

// === POINT DE TERMINAISON POUR LA NOTIFICATION DE CINETPAY ===
app.post('/notify', (req, res) => {
    console.log('Notification reçue de CinetPay :', req.body);
    // Logique de mise à jour de la base de données ici...
    res.status(200).send('Notification reçue.');
});

// Route pour la page de retour après paiement
app.get('/return', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'return.html'));
});


// Route principale pour servir le fichier HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur pour le développement local
// Vercel ignore cette partie et utilise l'export ci-dessous
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Serveur démarré pour le développement local sur http://localhost:${port}`);
    });
}

// Exporter l'application pour que Vercel puisse l'utiliser comme une fonction serverless
module.exports = app;

