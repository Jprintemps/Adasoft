const crypto = require('crypto');
const { SECRET_KEY } = process.env;

/**
 * Middleware to verify the HMAC signature from CinetPay notifications.
 * This ensures that the webhook request is authentic and came from CinetPay.
 */
exports.verifyHmac = (req, res, next) => {
    const receivedToken = req.headers['x-token'];

    if (!receivedToken) {
        console.warn('HMAC verification failed: No X-TOKEN header found.');
        return res.status(401).send('Unauthorized. Missing signature.');
    }

    try {
        // The data used for the signature is the raw request body.
        // We need a way to get it. A common method is to use a middleware that
        // stores the raw body before it's parsed. For simplicity here, we assume
        // body-parser doesn't alter the order and we can reconstruct it.
        // NOTE: For production, a more robust method of capturing the raw body is recommended.
        const postData = req.body;
        const dataString = Object.values(postData).join('');

        // Generate the expected token
        const expectedToken = crypto
            .createHmac('sha256', SECRET_KEY)
            .update(dataString)
            .digest('hex');

        console.log(`Received Token: ${receivedToken}`);
        console.log(`Generated Token: ${expectedToken}`);

        // Use a timing-safe comparison to prevent timing attacks
        const isTokenValid = crypto.timingSafeEqual(
            Buffer.from(receivedToken, 'hex'),
            Buffer.from(expectedToken, 'hex')
        );

        if (!isTokenValid) {
            console.error('HMAC verification failed: Tokens do not match.');
            return res.status(401).send('Unauthorized. Invalid signature.');
        }

        console.log('HMAC signature verified successfully.');
        next(); // Signature is valid, proceed to the controller

    } catch (error) {
        console.error('Error during HMAC verification:', error);
        return res.status(500).send('Internal server error during authentication.');
    }
};
