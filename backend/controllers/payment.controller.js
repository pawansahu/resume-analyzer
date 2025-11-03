import paymentService from '../services/payment.service.js';

/**
 * Get available payment plans
 */
export const getPlans = async (req, res) => {
  try {
    const plans = paymentService.getPlans();
    res.json({ success: true, plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch payment plans' 
    });
  }
};

/**
 * Create payment intent (Razorpay or Stripe based on region)
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { planId, provider } = req.body;
    const userId = req.user.userId;

    console.log('Creating payment intent:', { userId, planId, provider });

    if (!planId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Plan ID is required' 
      });
    }

    // Validate purchase eligibility
    const validation = await paymentService.validatePurchase(userId, planId);
    if (!validation.allowed) {
      return res.status(400).json({ 
        success: false, 
        error: validation.reason 
      });
    }

    let paymentIntent;

    if (provider === 'stripe') {
      console.log('Using Stripe provider');
      paymentIntent = await paymentService.createStripeIntent(userId, planId);
    } else {
      // Default to Razorpay for Indian users
      console.log('Using Razorpay provider');
      paymentIntent = await paymentService.createRazorpayIntent(userId, planId);
    }

    console.log('Payment intent created successfully:', paymentIntent.orderId || paymentIntent.paymentIntentId);
    res.json({ success: true, paymentIntent });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create payment intent' 
    });
  }
};

/**
 * Verify Razorpay payment
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing payment verification parameters' 
      });
    }

    // Verify signature
    const isValid = paymentService.verifyRazorpaySignature(
      orderId, 
      paymentId, 
      signature
    );

    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payment signature' 
      });
    }

    // Process payment
    const result = await paymentService.processSuccessfulPayment(
      null,
      orderId,
      'razorpay'
    );

    res.json({ 
      success: true, 
      message: 'Payment verified and processed successfully',
      payment: result.payment
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to verify payment' 
    });
  }
};

/**
 * Confirm Stripe payment
 */
export const confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment intent ID is required' 
      });
    }

    // Process payment
    const result = await paymentService.processSuccessfulPayment(
      null,
      paymentIntentId,
      'stripe'
    );

    res.json({ 
      success: true, 
      message: 'Payment confirmed successfully',
      payment: result.payment
    });
  } catch (error) {
    console.error('Error confirming Stripe payment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to confirm payment' 
    });
  }
};

/**
 * Handle Razorpay webhook
 */
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = req.body;

    await paymentService.handleRazorpayWebhook(payload, signature);

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
    res.status(400).json({ 
      success: false, 
      error: 'Webhook processing failed' 
    });
  }
};

/**
 * Handle Stripe webhook
 */
export const stripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    await paymentService.handleStripeWebhook(payload, signature);

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    res.status(400).json({ 
      success: false, 
      error: 'Webhook processing failed' 
    });
  }
};

/**
 * Request refund
 */
export const requestRefund = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;
    const userId = req.user.userId;

    if (!paymentId || !reason) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment ID and reason are required' 
      });
    }

    const result = await paymentService.processRefund(
      paymentId, 
      reason, 
      userId
    );

    res.json({ 
      success: true, 
      message: 'Refund processed successfully',
      refund: result
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to process refund' 
    });
  }
};

/**
 * Get user payment history
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const payments = await paymentService.getUserPayments(userId);

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch payment history' 
    });
  }
};

/**
 * Get refund rate (admin only)
 */
export const getRefundRate = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const refundRate = await paymentService.getRefundRate(days);

    res.json({ success: true, refundRate });
  } catch (error) {
    console.error('Error fetching refund rate:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch refund rate' 
    });
  }
};

/**
 * Create billing portal session
 */
export const createBillingPortal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { returnUrl } = req.body;

    const session = await paymentService.createBillingPortalSession(userId, returnUrl);

    res.json({ 
      success: true, 
      url: session.url,
      sessionId: session.sessionId
    });
  } catch (error) {
    console.error('Error creating billing portal:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create billing portal session' 
    });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reason } = req.body;

    const result = await paymentService.cancelSubscription(userId, reason);

    res.json({ 
      success: true, 
      message: result.message,
      expiresAt: result.expiresAt,
      user: result.user // Return updated user data for frontend
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to cancel subscription' 
    });
  }
};

/**
 * Get subscription details
 */
export const getSubscriptionDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const details = await paymentService.getSubscriptionDetails(userId);

    res.json({ 
      success: true, 
      subscription: details
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch subscription details' 
    });
  }
};
