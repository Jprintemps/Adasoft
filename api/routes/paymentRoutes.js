const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyHmac } = require('../middlewares/securityMiddleware');

/**
 * @route   POST /api/payment/initiate
 * @desc    Initiates a payment by generating a CinetPay payment link.
 * @access  Public
 */
router.post('/initiate', paymentController.initiatePayment);

/**
 * @route   POST /api/payment/notify
 * @desc    Webhook endpoint for CinetPay to send payment notifications.
 * This is the only endpoint that should trigger database updates.
 * @access  Public (Secured by HMAC middleware)
 */
router.post('/notify', verifyHmac, paymentController.handleNotification);

/**
 * @route   POST /api/payment/return
 * @desc    Endpoint where the user is redirected after a payment attempt.
 * This should ONLY display a status message and NOT update the database.
 * @access  Public
 */
router.post('/return', paymentController.handleReturn);

/**
 * @route   GET /api/payment/return
 * @desc    Handles GET requests for the return URL as well.
 * @access  Public
 */
router.get('/return', paymentController.handleReturn);

module.exports = router;
