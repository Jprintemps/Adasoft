<?php
$marchand = array(
    "apikey" => getenv('CINETPAY_APIKEY') ?: '', // Enrer votre apikey
    "site_id" => getenv('CINETPAY_SITE_ID') ?: '', //Entrer votre site_ID
    "secret_key" => getenv('CINETPAY_SECRET_KEY') ?: ''//Entrer votre clé secret
);