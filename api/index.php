<?php
/*Commenter ses deux lines si vous êtes en production
error_reporting(E_ALL);
ini_set('display_errors', 1);*/

// required libs
require_once __DIR__ . '/src/cinetpay.php';
include('marchand.php');
include('commande.php');

// La class gère la table "Commande"( A titre d'exemple)
$commande = new Commande();
try {
    if(isset($_POST['valide']))
    {
        $customer_name = $_POST['customer_name'];
        $customer_surname = $_POST['customer_surname'];
        $description = $_POST['description'];
        $amount = $_POST['amount'];
        $currency = $_POST['currency'];

        // On combine l'indicatif et le numéro local
        $customer_phone_prefix = $_POST['customer_phone_prefix'];
        $customer_phone_number_local = $_POST['customer_phone_number_local'];
        $customer_phone_number = $customer_phone_prefix . $customer_phone_number_local;

        // On récupère le code ISO du pays depuis le champ caché
        $customer_country = $_POST['customer_country'];


        //transaction id
        $id_transaction = date("YmdHis"); // or $id_transaction = Cinetpay::generateTransId()

        //Veuillez entrer votre apiKey
        $apikey = $marchand["apikey"];
        //Veuillez entrer votre siteId
        $site_id = $marchand["site_id"];

        //notify url
        $notify_url = $commande->getCurrentUrl().'api/notify/notify.php';
        //return url
        $return_url = $commande->getCurrentUrl().'api/return/return.php';
        
        // On spécifie MOBILE_MONEY comme seul canal de paiement
        $channels = "MOBILE_MONEY";
        
        /*information supplémentaire que vous voulez afficher
         sur la facture de CinetPay(Supporte trois variables 
         que vous nommez à votre convenance)*/
        $invoice_data = array(
            "Data 1" => "",
            "Data 2" => "",
            "Data 3" => ""
        );

        //
        $formData = array(
            "transaction_id"=> $id_transaction,
            "amount"=> $amount,
            "currency"=> $currency,
            "customer_surname"=> $customer_name,
            "customer_name"=> $customer_surname,
            "description"=> $description,
            "notify_url" => $notify_url,
            "return_url" => $return_url,
            "channels" => $channels,
            "invoice_data" => $invoice_data,
            // Le numéro de téléphone complet est envoyé ici
            "customer_phone_number" => $customer_phone_number,
            // Le code ISO du pays est maintenant inclus
            "customer_country" => $customer_country
        );
        // enregistrer la transaction dans votre base de donnée
        /* $commande->create(); */

        $CinetPay = new CinetPay($site_id, $apikey , $VerifySsl=false);//$VerifySsl=true <=> Pour activerr la verification ssl sur curl 
        $result = $CinetPay->generatePaymentLink($formData);

        if ($result["code"] == '201')
        {
            $url = $result["data"]["payment_url"];

            // ajouter le token à la transaction enregistré
            /* $commande->update(); */
            //redirection vers l'url de paiement
            header('Location:'.$url);

        } else {
            // Gérer l'erreur si la génération du lien échoue
            echo "Erreur lors de la génération du lien de paiement : " . $result['message'] . (isset($result['description']) ? ' - ' . $result['description'] : '');
        }
    }
    else{
        echo "Veuillez passer par le formulaire";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
