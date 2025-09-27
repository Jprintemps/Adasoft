<?php
/**
 * Fichier: notify.php
 * Rôle: Endpoint Webhook (Notify_url) pour recevoir les confirmations de paiement de CinetPay.
 * Sécurisé par signature HMAC. C'est la source de vérité pour mettre à jour la BDD.
 * Auteur: Développeur Senior (revu et corrigé)
 * Date: 26 septembre 2025
 */

// Inclure la fonction de vérification
require __DIR__ . '/check-status.php';

// Sur Vercel, error_log() est la meilleure méthode pour logger.
error_log("--- CinetPay Notification Received: " . date("c") . " ---");

try {
    // --- Vérification de la signature HMAC ---
    $secretKey = getenv('CINETPAY_SECRET_KEY');
    if (!$secretKey) {
        throw new Exception("Clé secrète non configurée sur le serveur.", 500);
    }

    $receivedToken = $_SERVER['HTTP_X_TOKEN'] ?? '';
    if (empty($receivedToken)) {
        throw new Exception('Signature HMAC manquante (X-TOKEN).', 401);
    }

    $raw_post_data = file_get_contents('php://input');
    $expectedToken = hash_hmac('sha256', $raw_post_data, $secretKey);

    if (!hash_equals($expectedToken, $receivedToken)) {
        error_log("HMAC Mismatch - Received: $receivedToken | Expected: $expectedToken");
        throw new Exception('Signature HMAC invalide.', 403);
    }
    // --- Fin de la vérification HMAC ---

    error_log("HMAC OK. Processing notification...");
    
    $notification_data = json_decode($raw_post_data, true);
    $cpm_trans_id = $notification_data['cpm_trans_id'] ?? null;

    if (!$cpm_trans_id) {
        throw new Exception('ID de transaction manquant dans la notification.', 400);
    }
    
    // --- Double vérification du statut auprès de CinetPay ---
    $paymentInfo = checkCinetPayStatus($cpm_trans_id);

    // Le statut se trouve dans 'data.status' pour V2 ou 'code' pour V1
    $code = $paymentInfo['data']['status'] ?? $paymentInfo['code'];
    $message = $paymentInfo['message'];
    error_log("Verified Status for $cpm_trans_id - Code: $code, Message: $message");

    // --- LOGIQUE MÉTIER (À ADAPTER) ---
    // C'est ici que vous interagissez avec votre base de données.
    
    // 1. Récupérez la commande depuis votre BDD.
    //    $order = getOrderFromDatabase($cpm_trans_id);

    // 2. Vérifiez si la commande n'a pas déjà été traitée pour éviter les doublons.
    //    if ($order && $order['status'] === 'SUCCESS') {
    //        error_log("Transaction $cpm_trans_id already processed.");
    //        http_response_code(200); // On dit à CinetPay que tout va bien.
    //        echo 'Notification already processed.';
    //        exit;
    //    }

    // 3. Vérifiez que le montant payé correspond à celui attendu.
    //    if ((int)$paymentInfo['data']['amount'] !== (int)$order['amount']) {
    //        error_log("CRITICAL: Amount mismatch for $cpm_trans_id!");
    //        // Mettez la commande en attente de vérification manuelle.
    //        // updateOrderStatusInDatabase($cpm_trans_id, 'MANUAL_CHECK_NEEDED');
    //        throw new Exception('Amount mismatch detected.');
    //    }

    if ($code === 'ACCEPTED' || $paymentInfo['code'] === '00') {
        // Le paiement est un succès. Mettez à jour votre BDD et livrez le service.
        // updateOrderStatusInDatabase($cpm_trans_id, 'SUCCESS');
        error_log("SUCCESS: Payment for $cpm_trans_id completed. Service delivered.");
    } else {
        // Le paiement a échoué. Mettez à jour votre BDD.
        // updateOrderStatusInDatabase($cpm_trans_id, 'FAILED');
        error_log("FAILURE: Payment for $cpm_trans_id failed. Reason: $message");
    }

    // Répondre à CinetPay pour accuser réception
    http_response_code(200);
    echo 'Notification processed successfully.';

} catch (Exception $e) {
    $errorCode = $e->getCode() >= 400 ? $e->getCode() : 500;
    http_response_code($errorCode);
    error_log("Error processing notification: " . $e->getMessage());
    echo $e->getMessage();
}
