const crypto = require('crypto');

/**
 * Middleware to verify the HMAC signature from CinetPay notifications.
 * This ensures that the webhook request is authentic and came from CinetPay.
 */
exports.verifyHmac = (req, res, next) => {
    const secretKey = process.env.CINETPAY_SECRET_KEY;
    const receivedToken = req.headers['x-token'];

    if (!secretKey) {
        console.error('CRITICAL: CINETPAY_SECRET_KEY is not defined.');
        return res.status(500).send('Server configuration error.');
    }

    if (!receivedToken) {
        console.warn('HMAC verification failed: No X-TOKEN header found.');
        return res.status(401).send('Unauthorized. Missing signature.');
    }

    try {
        const postData = req.body;

        // --- CORRECTION MAJEURE ---
        // Pour garantir une signature cohérente, nous trions les clés de l'objet
        // par ordre alphabétique avant de concaténer leurs valeurs.
        const sortedKeys = Object.keys(postData).sort();
        const dataString = sortedKeys.map(key => postData[key]).join('');
        // --- FIN DE LA CORRECTION ---

        const expectedToken = crypto
            .createHmac('sha256', secretKey)
            .update(dataString)
            .digest('hex');

        // Utilisation d'une comparaison sécurisée pour éviter les attaques temporelles
        const isTokenValid = crypto.timingSafeEqual(
            Buffer.from(receivedToken, 'utf8'),
            Buffer.from(expectedToken, 'utf8')
        );

        if (!isTokenValid) {
            console.error('HMAC verification failed: Tokens do not match.');
            return res.status(403).send('Unauthorized. Invalid signature.');
        }

        console.log('HMAC signature verified successfully.');
        next(); // La signature est valide, on passe au contrôleur

    } catch (error) {
        console.error('Error during HMAC verification:', error);
        return res.status(500).send('Internal server error during authentication.');
    }
};

