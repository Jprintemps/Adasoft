<?php
// Fichier: api/check-status.php
// Rôle: Contient une fonction réutilisable pour vérifier le statut d'une transaction auprès de CinetPay.
// Ce fichier est inclus par notify.php et return.php.

if (function_exists('checkCinetPayStatus')) {
    return;
}

/**
 * Interroge l'API de CinetPay pour obtenir le statut d'une transaction.
 *
 * @param string $transaction_id L'ID de la transaction à vérifier.
 * @param array $config Le tableau de configuration contenant l'apikey, le site_id, etc.
 * @return array|null Les données de la réponse de CinetPay ou null en cas d'erreur.
 */
function checkCinetPayStatus(string $transaction_id, array $config): ?array
{
    $data = [
        'apikey' => $config['apikey'],
        'site_id' => $config['site_id'],
        'transaction_id' => $transaction_id,
    ];

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $config['base_url'] . '/payment/check',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    ]);

    $response = curl_exec($curl);
    $err = curl_error($curl);
    curl_close($curl);

    if ($err) {
        error_log("cURL Error on check status for $transaction_id: " . $err);
        return null;
    }

    return json_decode($response, true);
}

