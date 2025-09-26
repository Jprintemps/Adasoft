<?php
/**
 * Fichier: return.php
 * Rôle: Page où l'utilisateur est redirigé après sa tentative de paiement (Return_url).
 * Affiche un message de succès ou d'échec. NE DOIT PAS mettre à jour la BDD.
 * Auteur: Développeur Senior (revu et corrigé)
 * Date: 26 septembre 2025
 */

// Inclure la fonction de vérification de statut
require __DIR__ . '/check-status.php';

$transaction_id = $_GET['transaction_id'] ?? null;
$message = "Une erreur est survenue.";
$status = 'error';

if ($transaction_id) {
    try {
        $paymentInfo = checkCinetPayStatus($transaction_id);

        // Le statut se trouve dans 'data.status' pour V2 ou 'code' pour V1
        $code = $paymentInfo['data']['status'] ?? $paymentInfo['code'];

        if ($code === 'ACCEPTED' || $paymentInfo['code'] === '00') {
            $status = 'success';
            $message = "Félicitations, votre paiement a été effectué avec succès. Nous traitons votre commande et vous recevrez bientôt une confirmation par e-mail.";
        } else {
            $status = 'failure';
            $message = "Malheureusement, votre paiement a échoué. Raison : " . htmlspecialchars($paymentInfo['message']);
        }
    } catch (Exception $e) {
        $status = 'error';
        $message = "Nous n'avons pas pu vérifier le statut final de votre transaction. Veuillez vérifier vos e-mails ou contacter le support si un montant a été débité. Erreur : " . htmlspecialchars($e->getMessage());
    }
} else {
    $status = 'error';
    $message = "Aucun identifiant de transaction n'a été fourni. Impossible de vérifier le paiement.";
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Statut de votre paiement - Adasoft</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f4f4f7; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 1rem; }
        .status-card { background-color: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.1); padding: 2.5rem; text-align: center; max-width: 500px; border-top: 5px solid; }
        .status-card.success { border-color: #28a745; }
        .status-card.failure { border-color: #dc3545; }
        .status-card.error { border-color: #ffc107; }
        h1 { font-size: 1.8rem; margin-top: 0; margin-bottom: 1rem; }
        p { color: #555; line-height: 1.6; }
        .home-link { display: inline-block; margin-top: 1.5rem; padding: 0.8rem 1.5rem; background-color: #1d0e0e; color: #fff; text-decoration: none; border-radius: 50px; font-weight: 600; transition: background-color 0.2s; }
        .home-link:hover { background-color: #fc4f50; }
    </style>
</head>
<body>
    <div class="status-card <?php echo $status; ?>">
        <h1>
            <?php
            if ($status === 'success') echo "Paiement Réussi !";
            elseif ($status === 'failure') echo "Paiement Échoué";
            else echo "Erreur de Vérification";
            ?>
        </h1>
        <p><?php echo $message; ?></p>
        <a href="/" class="home-link">Retourner à l'accueil</a>
    </div>
</body>
</html>
