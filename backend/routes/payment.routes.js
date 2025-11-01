import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/payments/plans
 * @desc    Get available payment plans
 * @access  Public
 */
router.get('/plans', paymentController.getPlans);

/**
 * @route   POST /api/payments/create-intent
 * @desc    Create payment intent (Razorpay or Stripe)
 * @access  Private
 */
router.post(
  '/create-intent',
  authMiddleware.authenticate,
  paymentController.createPaymentIntent
);

/**
 * @route   POST /api/payments/verify-razorpay
 * @desc    Verify Razorpay payment
 * @access  Private
 */
router.post(
  '/verify-razorpay',
  authMiddleware.authenticate,
  paymentController.verifyRazorpayPayment
);

/**
 * @route   POST /api/payments/confirm-stripe
 * @desc    Confirm Stripe payment
 * @access  Private
 */
router.post(
  '/confirm-stripe',
  authMiddleware.authenticate,
  paymentController.confirmStripePayment
);

/**
 * @route   POST /api/payments/webhook/razorpay
 * @desc    Handle Razorpay webhook
 * @access  Public (verified by signature)
 */
router.post('/webhook/razorpay', paymentController.razorpayWebhook);

/**
 * @route   POST /api/payments/webhook/stripe
 * @desc    Handle Stripe webhook
 * @access  Public (verified by signature)
 */
router.post('/webhook/stripe', paymentController.stripeWebhook);

/**
 * @route   POST /api/payments/refund
 * @desc    Request refund
 * @access  Private
 */
router.post(
  '/refund',
  authMiddleware.authenticate,
  paymentController.requestRefund
);

/**
 * @route   GET /api/payments/history
 * @desc    Get user payment history
 * @access  Private
 */
router.get(
  '/history',
  authMiddleware.authenticate,
  paymentController.getPaymentHistory
);

/**
 * @route   GET /api/payments/refund-rate
 * @desc    Get refund rate (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/refund-rate',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  paymentController.getRefundRate
);

export default router;
