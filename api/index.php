
// Fichier: api/initiate-payment.php
// Rôle: Correspond à l'étape 3 de la documentation ("Préparation et affichage du guichet").
// Reçoit la demande du formulaire, la valide, et demande un token de paiement à CinetPay.
<?php
phpinfo();
header('Content-Type: application/json');

$config = require __DIR__ . '/config.php';
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['message' => 'Données JSON invalides.']);
    exit;
}

// Validation des champs requis par la documentation pour l'initiation
$required_fields = ['amount', 'currency', 'description', 'customer_name', 'customer_surname', 'customer_email'];
foreach ($required_fields as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['message' => "Le champ requis '$field' est manquant."]);
        exit;
    }
}

// Génération d'un ID de transaction unique comme suggéré
$transaction_id = 'ADASOFT-' . date("YmdHis") . '-' . bin2hex(random_bytes(2));

// Préparation des données conformément à la documentation
$paymentData = [
    'apikey'            => $config['apikey'],
    'site_id'           => $config['site_id'],
    'transaction_id'    => $transaction_id,
    'amount'            => (int)$input['amount'],
    'currency'          => $input['currency'],
    'description'       => $input['description'],
    'notify_url'        => $config['app_base_url'] . '/api/notify.php',
    'return_url'        => $config['app_base_url'] . '/api/return.php',
    'channels'          => 'ALL',
    'customer_name'     => $input['customer_name'],
    'customer_surname'  => $input['customer_surname'],
    'customer_email'    => $input['customer_email'],
    // Vous pouvez ajouter d'autres champs ici si nécessaire (metadata, etc.)
];

// Appel à l'API CinetPay avec cURL
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => $config['base_url'] . '/payment',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => json_encode($paymentData),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
]);

$response = curl_exec($curl);
$err = curl_error($curl);
$http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($err) {
    http_response_code(500);
    echo json_encode(['message' => 'Erreur de communication avec le service de paiement.', 'details' => $err]);
    exit;
}

$responseData = json_decode($response, true);

// Traitement de la réponse de CinetPay
if ($http_code === 200 && isset($responseData['code']) && $responseData['code'] == '201') {
    http_response_code(200);
    echo json_encode([
        'payment_token' => $responseData['data']['payment_token'],
        'transaction_id' => $transaction_id
    ]);
} else {
    http_response_code(502); // Bad Gateway, car le service externe a renvoyé une erreur
    echo json_encode([
        'message' => 'Le service de paiement a refusé la transaction.',
        'details' => $responseData['message'] ?? 'Raison inconnue.'
    ]);
}

