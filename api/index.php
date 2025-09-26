<?php
/**
 * Fichier: initiate-payment.php
 * Rôle: Endpoint API pour démarrer une transaction de paiement avec CinetPay.
 * Reçoit les données du frontend, les valide, et renvoie un lien de paiement.
 * Auteur: Développeur Senior (revu et corrigé)
 * Date: 26 septembre 2025
 */

// --- EN-TÊTES ET CONFIGURATION ---
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Pour le développement, à restreindre en production.
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer les requêtes preflight OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- LOGIQUE DE L'API ---
try {
    // S'assurer que la requête est de type POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Méthode non autorisée. Seules les requêtes POST sont acceptées.', 405);
    }
    
    // Récupérer les clés depuis les variables d'environnement (méthode sécurisée pour Vercel)
    $apiKey = getenv('CINETPAY_API_KEY');
    $siteId = getenv('CINETPAY_SITE_ID');
    $baseUrl = getenv('APP_BASE_URL'); // URL de votre site (ex: https://adasoft.vercel.app)

    if (!$apiKey || !$siteId || !$baseUrl) {
        throw new Exception("Variables d'environnement manquantes sur le serveur.", 500);
    }

    // Récupérer et décoder les données JSON envoyées par le frontend
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Données JSON invalides.', 400);
    }

    // Valider les données reçues
    $required_fields = ['amount', 'currency', 'description', 'customer_name', 'customer_surname'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            throw new Exception("Le champ '$field' est manquant ou vide.", 400);
        }
    }

    // Préparer les données pour l'API CinetPay
    $transaction_id = "ADASOFT-" . time() . rand(1000, 9999);
    $notify_url = rtrim($baseUrl, '/') . '/api/notify.php';
    $return_url = rtrim($baseUrl, '/') . '/api/return.php';

    $payment_data = [
        "apikey" => $apiKey,
        "site_id" => (int)$siteId,
        "transaction_id" => $transaction_id,
        "amount" => (int)$data['amount'],
        "currency" => $data['currency'],
        "description" => $data['description'],
        "customer_name" => $data['customer_name'],
        "customer_surname" => $data['customer_surname'],
        "notify_url" => $notify_url,
        "return_url" => $return_url,
        "channels" => "ALL",
    ];

    // Utiliser cURL pour communiquer avec l'API CinetPay
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api-checkout.cinetpay.com/v2/payment",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 45,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => json_encode($payment_data),
        CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
    ]);

    $response = curl_exec($curl);
    $err = curl_error($curl);
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($err) {
        throw new Exception("Erreur cURL: " . $err, 500);
    }

    $response_data = json_decode($response, true);
    
    // Gérer la réponse de CinetPay
    if ($http_code == 200 && isset($response_data['code']) && $response_data['code'] == '201') {
        // Succès : Le lien de paiement a été généré
        http_response_code(200);
        echo json_encode(['payment_url' => $response_data['data']['payment_url']]);
    } else {
        // Échec : L'API CinetPay a renvoyé une erreur
        throw new Exception($response_data['message'] ?? 'Erreur inconnue de CinetPay.', 500);
    }

} catch (Exception $e) {
    // Gérer toutes les erreurs de manière centralisée
    $errorCode = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($errorCode);
    // Logger l'erreur sur Vercel pour le débogage
    error_log("API Error in initiate-payment.php: " . $e->getMessage());
    echo json_encode(['message' => $e->getMessage()]);
}
