<?php
// Fichier: api/notify.php
// Rôle: Gère le webhook de notification (Notify_url), sécurisé par HMAC.
// C'est la seule source de vérité pour mettre à jour votre base de données.

$config = require __DIR__ . '/config.php';
require __DIR__ . '/check-status.php';

// Sur Vercel, error_log() est la meilleure méthode pour logger.
error_log("--- CinetPay Notification Received: ".date("F j, Y, g:i a")." ---");

// --- Vérification de la signature HMAC (selon la documentation) ---
$receivedToken = $_SERVER['HTTP_X_TOKEN'] ?? '';
if (empty($receivedToken)) {
    error_log("HMAC Error: Missing X-TOKEN header");
    http_response_code(401);
    die('Unauthorized. Missing signature.');
}

// Pour une API JSON, la chaîne à signer est le corps brut de la requête.
$raw_post_data = file_get_contents('php://input');
$expectedToken = hash_hmac('sha256', $raw_post_data, $config['secret_key']);

if (!hash_equals($expectedToken, $receivedToken)) {
    error_log("HMAC Error: Invalid signature. Received: $receivedToken");
    http_response_code(403);
    die('Unauthorized. Invalid signature.');
}
// --- Fin de la vérification HMAC ---

// La notification est authentique. On traite les données.
$notification_data = json_decode($raw_post_data, true);
$cpm_trans_id = $notification_data['cpm_trans_id'] ?? null;

if (!$cpm_trans_id) {
    error_log("Error: cpm_trans_id not found in notification.");
    http_response_code(400);
    die('Transaction ID not found.');
}

error_log("HMAC OK. Processing transaction: $cpm_trans_id");

try {
    // Étape cruciale : Double vérification du statut auprès de CinetPay
    $paymentInfo = checkCinetPayStatus($cpm_trans_id, $config);

    if (!$paymentInfo || !isset($paymentInfo['code'])) {
        throw new Exception('Could not verify transaction status with CinetPay.');
    }
    
    // Le statut se trouve dans le sous-tableau 'data' ou dans le code principal
    $code = $paymentInfo['data']['status'] ?? $paymentInfo['code'];
    $message = $paymentInfo['message'];
    error_log("Verified Status - Code: $code, Message: $message");

    // TODO: Mettez ici votre logique métier (interactions avec la base de données)
    // 1. Récupérez la commande depuis votre DB : $order = getOrderFromDB($cpm_trans_id);
    // 2. Vérifiez si la commande n'a pas déjà été traitée : if ($order['status'] === 'SUCCESS') { die('Already processed.'); }
    // 3. Vérifiez que le montant correspond : if ((int)$paymentInfo['data']['amount'] != (int)$order['amount']) { throw new Exception('Amount mismatch!'); }

    if ($code == 'ACCEPTED' || $paymentInfo['code'] == '00') {
        // Le paiement est un succès. Mettez à jour votre base de données.
        // updateOrderStatusInDB($cpm_trans_id, 'SUCCESS');
        error_log("SUCCESS: Transaction completed for $cpm_trans_id. Deliver service.");
    } else {
        // Le paiement a échoué. Mettez à jour votre base de données.
        // updateOrderStatusInDB($cpm_trans_id, 'FAILED');
        error_log("FAILURE: Transaction failed for $cpm_trans_id. Reason: $message");
    }

} catch (Exception $e) {
    error_log("Error processing notification: " . $e->getMessage());
    http_response_code(500);
    die($e->getMessage());
}

// Répondre à CinetPay pour accuser réception
http_response_code(200);
echo 'Notification processed.';

