const crypto = require('crypto');
const axios = require('axios');

// Get credentials from environment variables
const { API_KEY, SITE_ID, CINETPAY_API_BASE_URL, APP_BASE_URL } = process.env;

/**
 * Service function to check payment status from CinetPay
 * @param {string} transactionId - The transaction ID to check.
 * @returns {Promise<object>} - The data from CinetPay API.
 */
const checkPaymentStatus = async (transactionId) => {
    try {
        const response = await axios.post(`${CINETPAY_API_BASE_URL}/payment/check`, {
            apikey: API_KEY,
            site_id: SITE_ID,
            transaction_id: transactionId,
        });
        return response.data;
    } catch (error) {
        console.error('Error checking payment status:', error.response ? error.response.data : error.message);
        throw new Error('Failed to verify transaction with CinetPay.');
    }
};

/**
 * Controller to initiate a payment.
 * Generates a payment link and redirects the user.
 */
exports.initiatePayment = async (req, res) => {
    try {
        console.log('Initiating payment with data:', req.body);

        const { amount, currency, description, customer_name, customer_surname } = req.body;

        if (!amount || !currency || !description || !customer_name || !customer_surname) {
            return res.status(400).json({ message: "Missing required payment fields." });
        }

        const transaction_id = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        // IMPORTANT: At this stage, you should save the transaction details
        // with a "PENDING" status in your database.
        // Example: await database.createTransaction({ id: transaction_id, status: 'PENDING', amount });

        const paymentData = {
            apikey: API_KEY,
            site_id: SITE_ID,
            transaction_id,
            amount: parseInt(amount, 10),
            currency,
            description,
            customer_name,
            customer_surname,
            notify_url: `${APP_BASE_URL}/api/payment/notify`,
            return_url: `${APP_BASE_URL}/api/payment/return`,
            channels: "ALL",
            metadata: JSON.stringify({ order_id: "REF123" }) // Optional: Pass your internal identifiers here
        };

        const { data } = await axios.post(`${CINETPAY_API_BASE_URL}/payment`, paymentData);

        if (data.code === '201') {
            const paymentUrl = data.data.payment_url;
            
            // IMPORTANT: You should now update the transaction in your database
            // with the payment token received from CinetPay.
            // Example: await database.updateTransaction(transaction_id, { token: data.data.payment_token });

            // Send the URL back to the client, which can then redirect the user
            return res.status(200).json({ payment_url: paymentUrl });

        } else {
            console.error('CinetPay initialization failed:', data.message);
            return res.status(500).json({ message: 'Failed to initiate payment.', details: data.message });
        }

    } catch (error) {
        console.error('Error during payment initiation:', error.response ? error.response.data : error.message);
        return res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

/**
 * Controller for the CinetPay Notification URL (Webhook).
 * This is the single source of truth for payment status.
 */
exports.handleNotification = async (req, res) => {
    console.log('Received notification:', req.body);
    
    const { cpm_trans_id, cpm_site_id } = req.body;

    if (!cpm_trans_id) {
        console.error('Notification Error: cpm_trans_id not provided.');
        return res.status(400).send('Transaction ID not provided.');
    }

    try {
        // 1. Verify transaction status with CinetPay to confirm the webhook data
        const paymentInfo = await checkPaymentStatus(cpm_trans_id);

        if (paymentInfo.code !== '00') {
            // This case might happen if the payment failed after all
            console.warn(`Payment verification failed for ${cpm_trans_id}. Message: ${paymentInfo.message}`);
            // Optional: Update your DB to a "FAILED" state
            // await database.updateTransaction(cpm_trans_id, { status: 'FAILED' });
            return res.status(200).send('Notification received, but payment failed.');
        }

        // 2. Check your database to see if the transaction has already been processed.
        // const transaction = await database.getTransaction(cpm_trans_id);
        // if (transaction.status === 'SUCCESS') {
        //     console.log(`Transaction ${cpm_trans_id} already processed.`);
        //     return res.status(200).send('Transaction already processed.');
        // }
        
        // 3. Confirm that the amount and currency match your records
        // const expectedAmount = transaction.amount;
        // if (paymentInfo.data.amount != expectedAmount) {
        //     console.error(`Amount mismatch for ${cpm_trans_id}. Expected: ${expectedAmount}, Received: ${paymentInfo.data.amount}`);
        //     // Handle this serious security issue (e.g., flag for manual review)
        //     return res.status(200).send('Amount mismatch.');
        // }

        // 4. If all checks pass, update your database and deliver the service/product
        console.log(`Successfully verified payment for transaction ${cpm_trans_id}.`);
        // await database.updateTransaction(cpm_trans_id, { status: 'SUCCESS' });
        // deliverProduct(transaction.order_id);

        // Respond to CinetPay to acknowledge receipt
        res.status(200).send('Notification processed successfully.');

    } catch (error) {
        console.error(`Error handling notification for ${cpm_trans_id}:`, error);
        // It's safer to respond with 200 to avoid repeated notifications, but log the error for investigation.
        res.status(500).send('An internal error occurred.');
    }
};

/**
 * Controller for the Return URL.
 * This should only display a status message to the user.
 */
exports.handleReturn = async (req, res) => {
    const transactionId = req.body.transaction_id || req.query.transaction_id;
    console.log(`Handling return for transaction: ${transactionId}`);

    if (!transactionId) {
        return res.status(400).send('<h1>Error: Transaction ID not found.</h1>');
    }

    try {
        const paymentInfo = await checkPaymentStatus(transactionId);
        
        // IMPORTANT: NO DATABASE UPDATE SHOULD HAPPEN HERE.

        if (paymentInfo.code === '00') {
            // Display a success message to the user
            return res.send('<h1>Félicitations, votre paiement a été effectué avec succès.</h1><p>Nous traitons votre commande.</p>');
        } else {
            // Display a failure message
            const reason = paymentInfo.message || 'Raison inconnue';
            return res.status(400).send(`<h1>Échec, votre paiement a échoué.</h1><p>Raison : ${reason}</p>`);
        }
    } catch (error) {
        console.error(`Error on return URL for ${transactionId}:`, error);
        return res.status(500).send('<h1>Erreur: Impossible de vérifier le statut de votre paiement.</h1>');
    }
};
