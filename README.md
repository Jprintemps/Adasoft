Intégration Professionnelle de CinetPay avec Node.js
Ce projet est une implémentation backend robuste pour l'intégration de la passerelle de paiement CinetPay, en utilisant Node.js, Express, et les meilleures pratiques de développement.

Fonctionnalités
Architecture Modulaire : Séparation claire des routes, des contrôleurs (logique métier) et des middlewares.

Sécurité Renforcée : Utilisation des variables d'environnement pour les clés secrètes et vérification systématique des signatures HMAC pour les webhooks.

Gestion Asynchrone : Utilisation de async/await pour des appels API non bloquants et un code lisible.

Journalisation (Logging) : Suivi des étapes clés du processus de paiement dans la console pour un débogage facile.

Endpoints Complets :

/api/payment/initiate : Pour créer une transaction et obtenir un lien de paiement.

/api/payment/notify : Webhook sécurisé pour recevoir les confirmations de paiement (la seule source de vérité).

/api/payment/return : Page de redirection pour l'utilisateur après la tentative de paiement.

Instructions d'Installation et de Lancement
1. Prérequis
Node.js (version 14.x ou supérieure)

Un compte marchand CinetPay avec vos API_KEY, SITE_ID, et SECRET_KEY.

2. Cloner le Projet
git clone <url-du-repository>
cd cinetpay-nodejs-integration

3. Installer les Dépendances
npm install

4. Configurer les Variables d'Environnement
Renommez le fichier .env.example en .env.

Ouvrez le fichier .env et remplissez vos informations d'identification CinetPay et la configuration de l'application.

API_KEY="VOTRE_API_KEY"
SITE_ID="VOTRE_SITE_ID"
SECRET_KEY="VOTRE_CLE_SECRETE"
PORT=3000
APP_BASE_URL="http://localhost:3000"

Note : Pour les tests en local, APP_BASE_URL doit être une URL accessible publiquement pour que CinetPay puisse envoyer des notifications. Utilisez un service comme ngrok pour exposer votre serveur local.

5. Lancer le Serveur
En mode développement (avec redémarrage automatique) :

npm run dev

En mode production :

npm start

Le serveur sera accessible à l'adresse http://localhost:3000.

Comment Utiliser les Endpoints
Pour Lancer un Paiement
Envoyez une requête POST à /api/payment/initiate avec un corps JSON contenant les détails de la transaction :

{
  "amount": 100,
  "currency": "XOF",
  "description": "Achat de test",
  "customer_name": "John",
  "customer_surname": "Doe"
}

La réponse contiendra une payment_url. Redirigez votre utilisateur vers cette URL pour qu'il puisse effectuer le paiement.











<form action="./api/index.php" method="post" class="payment-form">
                    
                    <div class="form-group">
                        <label for="customer-name">Nom</label>
                        <input type="text" id="customer-name" name="customer_name" placeholder="Ilunga" required />
                    </div>
                    
                    <div class="form-group">
                        <label for="customer-surname">Prénom</label>
                        <input type="text" id="customer-surname" name="customer_surname" placeholder="Jeremie" required />
                    </div>
                        <label for="customer_phone_number_local">Numéro de téléphone</label>
                        <div class="phone-group">
                            <select name="customer_phone_prefix" id="customer_phone_prefix" required onchange="updateCountryIso(this)">
                                <option value="225" data-iso="CI">Côte d'Ivoire (+225)</option>
                                <option value="226" data-iso="BF">Burkina Faso (+226)</option>
                                <option value="223" data-iso="ML">Mali (+223)</option>
                                <option value="221" data-iso="SN">Sénégal (+221)</option>
                                <option value="228" data-iso="TG">Togo (+228)</option>
                                <option value="229" data-iso="BJ">Bénin (+229)</option>
                                <option value="237" data-iso="CM">Cameroun (+237)</option>
                                <option value="241" data-iso="GA">Gabon (+241)</option>
                                <option value="242" data-iso="CG">Congo-Brazza (+242)</option>
                                <option value="243" data-iso="CD" selected>RD Congo (+243)</option>
                                <!-- Ajoutez d'autres pays au besoin -->
                            </select>
                            <input type="tel" id="customer_phone_number_local" name="customer_phone_number_local" placeholder="812345678" required/>
                        </div>
                    </div>
                    <div class="form-group">
                      <label for="form-amount">Montant en USD</label>
                      <input type="number" name="amount" id="form-amount" value="80" required readonly>
                    </div>
                    <div class="form-group">
                        <label for="currency">Devise</label>
                        <select name="currency" id="currency">
                            <option value="XOF">XOF</option>
                            <option value="XAF">XAF</option>
                            <option value="CDF" selected>CDF</option>
                            <option value="GNF">GNF</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="form-description">Description</label>
                        <input type="text" name="description" id="form-description" value="Achat sdk" required readonly >
                    </div>

                    <button type="submit" id="modal-submit-btn" name="valide" class="btn btn--primary btn-full-width">
                        Valider
                    </button>
                </form>