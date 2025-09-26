<?php
// Fichier: api/return.php
// Rôle: Page où l'utilisateur est redirigé après son paiement (Return_url).
// Affiche un message simple et NE DOIT PAS mettre à jour la base de données.

$config = require __DIR__ . '/config.php';
require __DIR__ . '/check-status.php';

// CinetPay peut utiliser 'transaction_id' ou 'token' comme paramètre
$transaction_id = $_GET['transaction_id'] ?? $_GET['token'] ?? null;

$pageTitle = "Statut de la Transaction";
$message = "Nous vérifions le statut de votre transaction...";
$statusClass = "pending";

if ($transaction_id) {
    $paymentInfo = checkCinetPayStatus($transaction_id, $config);

    if ($paymentInfo && isset($paymentInfo['code'])) {
        // Le code '00' indique un succès global de la vérification
        if ($paymentInfo['code'] == '00') {
            $pageTitle = "Paiement Réussi !";
            $message = "Félicitations, votre paiement a été effectué avec succès. Votre commande est en cours de traitement et vous recevrez bientôt une confirmation par e-mail.";
            $statusClass = "success";
        } else {
            $pageTitle = "Paiement Échoué";
            $message = "Malheureusement, votre paiement n'a pas pu être validé. Raison : " . htmlspecialchars($paymentInfo['message']);
            $statusClass = "error";
        }
    } else {
        $pageTitle = "Erreur de Vérification";
        $message = "Impossible de vérifier le statut de votre transaction. Veuillez contacter le support si le problème persiste.";
        $statusClass = "error";
    }
} else {
    $pageTitle = "Information Manquante";
    $message = "Aucun identifiant de transaction n'a été fourni.";
    $statusClass = "error";
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($pageTitle); ?> - Adasoft</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f4f5f7; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1rem; }
        .container { background-color: white; padding: clamp(1.5rem, 5vw, 3rem); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
        h1 { font-size: 1.75rem; color: #1d1d1b; margin-bottom: 1rem; }
        p { color: #555; line-height: 1.6; }
        .icon { width: 60px; height: 60px; margin: 0 auto 1.5rem; }
        .success .icon { color: #28a745; }
        .error .icon { color: #dc3545; }
        a.button { display: inline-block; margin-top: 2rem; padding: 0.75rem 1.5rem; background-color: #fc4f50; color: white; text-decoration: none; border-radius: 50px; font-weight: 600; transition: background-color 0.2s; }
        a.button:hover { background-color: #e63c3d; }
    </style>
</head>
<body class="<?php echo htmlspecialchars($statusClass); ?>">
    <div class="container">
        <?php if ($statusClass == 'success'): ?>
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <?php else: ?>
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <?php endif; ?>
        <h1><?php echo htmlspecialchars($pageTitle); ?></h1>
        <p><?php echo $message; ?></p>
        <a href="/" class="button">Retourner à l'accueil</a>
    </div>
</body>
</html>

