<?php
// Fichier: api/config.php
// Rôle: Centralise vos clés secrètes et les URLs.
// Correspond à l'étape 1 de la documentation ("marchand.php").

// En production sur Vercel, les valeurs sont lues depuis les variables d'environnement.
return [
    'apikey'       => getenv('CINETPAY_APIKEY') ?: '', // Votre APIKEY de CinetPay
    'site_id'      => getenv('CINETPAY_SITE_ID') ?: '', // Votre SITEID de CinetPay
    'secret_key'   => getenv('CINETPAY_SECRET_KEY') ?: '', // Votre Clé Secrète pour la vérification HMAC

    // Ne pas modifier les lignes ci-dessous
    'base_url'     => 'https://api-checkout.cinetpay.com/v2',
    // Vercel fournit automatiquement la variable d'environnement de l'URL publique
    'app_base_url' => isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https' && isset($_SERVER['HTTP_HOST']) ? 'https://' . $_SERVER['HTTP_HOST'] : 'http://localhost:3000'
];

