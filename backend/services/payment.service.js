import Razorpay from 'razorpay';
import Stripe from 'stripe';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import crypto from 'crypto';
import emailService from './email.service.js';

class PaymentService {
  constructor() {
    // Initialize Razorpay for Indian payments (only if credentials are provided)
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      console.log('✅ Razorpay initialized');
    } else {
      console.warn('⚠️  Razorpay credentials not configured');
      this.razorpay = null;
    }

    // Initialize Stripe for international payments (only if credentials are provided)
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      console.log('✅ Stripe initialized');
    } else {
      console.warn('⚠️  Stripe credentials not configured');
      this.stripe = null;
    }

    // Payment plans configuration
    this.plans = {
      'one-time': {
        id: 'one-time',
        name: 'One-Time Premium',
        amount: 9900, // ₹99 in paise
        currency: 'INR',
        duration: 'lifetime',
        tier: 'premium'
      },
      'monthly': {
        id: 'monthly',
        name: 'Monthly Subscription',
        amount: 49900, // ₹499 in paise
        currency: 'INR',
        duration: 'monthly',
        tier: 'premium'
      }
    };
  }

  /**
   * Create payment intent for Razorpay (Indian users)
   */
  async createRazorpayIntent(userId, planId) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables.');
      }

      const plan = this.plans[planId];
      if (!plan) {
        throw new Error('Invalid plan ID');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create Razorpay order
      const order = await this.razorpay.orders.create({
        amount: plan.amount,
        currency: plan.currency,
        receipt: `receipt_${userId}_${Date.now()}`,
        notes: {
          userId: userId.toString(),
          planId: planId,
          email: user.email
        }
      });

      // Create payment record
      const payment = new Payment({
        userId,
        provider: 'razorpay',
        providerPaymentId: order.id,
        amount: plan.amount / 100, // Convert paise to rupees
        currency: plan.currency,
        planId,
        status: 'pending'
      });
      await payment.save();

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        planName: plan.name,
        paymentId: payment._id
      };
    } catch (error) {
      console.error('Error creating Razorpay intent:', error);
      throw error;
    }
  }

  /**
   * Create payment intent for Stripe (International users)
   */
  async createStripeIntent(userId, planId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.');
      }

      const plan = this.plans[planId];
      if (!plan) {
        throw new Error('Invalid plan ID');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Convert INR to USD (approximate conversion for demo)
      const amountInUSD = Math.round((plan.amount / 100) * 0.012 * 100); // Convert to cents

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInUSD,
        currency: 'usd',
        metadata: {
          userId: userId.toString(),
          planId: planId,
          email: user.email
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      // Create payment record
      const payment = new Payment({
        userId,
        provider: 'stripe',
        providerPaymentId: paymentIntent.id,
        amount: amountInUSD / 100,
        currency: 'usd',
        planId,
        status: 'pending'
      });
      await payment.save();

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountInUSD,
        currency: 'usd',
        planName: plan.name,
        paymentId: payment._id
      };
    } catch (error) {
      console.error('Error creating Stripe intent:', error);
      throw error;
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  verifyRazorpaySignature(orderId, paymentId, signature) {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Process successful payment and upgrade user account
   */
  async processSuccessfulPayment(paymentId, providerPaymentId, provider) {
    try {
      const payment = await Payment.findOne({
        providerPaymentId,
        provider
      });

      if (!payment) {
        throw new Error('Payment record not found');
      }

      if (payment.status === 'completed') {
        return { success: true, message: 'Payment already processed' };
      }

      // Update payment status
      payment.status = 'completed';
      await payment.save();

      // Upgrade user account
      const user = await this.upgradeUserAccount(payment.userId, payment.planId);

      // Send payment confirmation email
      await emailService.sendPaymentConfirmation(user, payment);

      return {
        success: true,
        message: 'Payment processed successfully',
        payment
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Upgrade user account based on plan
   */
  async upgradeUserAccount(userId, planId) {
    try {
      const plan = this.plans[planId];
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      user.userTier = plan.tier;

      if (plan.duration === 'monthly') {
        // Set subscription expiry to 30 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        user.subscriptionStatus = 'active';
        user.subscriptionExpiresAt = expiryDate;
      } else {
        // One-time payment - lifetime access
        user.subscriptionStatus = 'active';
        user.subscriptionExpiresAt = null; // No expiry for one-time
      }

      await user.save();

      return user;
    } catch (error) {
      console.error('Error upgrading user account:', error);
      throw error;
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async handleRazorpayWebhook(payload, signature) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const event = payload.event;
      const paymentData = payload.payload.payment.entity;

      switch (event) {
        case 'payment.captured':
          await this.processSuccessfulPayment(
            null,
            paymentData.order_id,
            'razorpay'
          );
          break;

        case 'payment.failed':
          await this.handlePaymentFailure(paymentData.order_id, 'razorpay');
          break;

        case 'subscription.charged':
          // Handle subscription renewal
          await this.handleSubscriptionRenewal(paymentData);
          break;

        default:
          console.log('Unhandled Razorpay event:', event);
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling Razorpay webhook:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.processSuccessfulPayment(
            null,
            event.data.object.id,
            'stripe'
          );
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object.id, 'stripe');
          break;

        case 'invoice.payment_succeeded':
          // Handle subscription renewal
          await this.handleSubscriptionRenewal(event.data.object);
          break;

        case 'customer.subscription.deleted':
          // Handle subscription cancellation
          await this.handleSubscriptionCancellation(event.data.object);
          break;

        default:
          console.log('Unhandled Stripe event:', event.type);
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      throw error;
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(providerPaymentId, provider) {
    try {
      const payment = await Payment.findOne({
        providerPaymentId,
        provider
      });

      if (payment) {
        payment.status = 'failed';
        await payment.save();

        // Send payment failure email
        const user = await User.findById(payment.userId);
        if (user) {
          await emailService.sendPaymentFailure(user, payment);
        }
      }

      console.log('Payment failed:', providerPaymentId);
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  /**
   * Handle subscription renewal
   */
  async handleSubscriptionRenewal(subscriptionData) {
    try {
      // Extract user ID from metadata
      const userId = subscriptionData.metadata?.userId || subscriptionData.notes?.userId;

      if (!userId) {
        console.error('User ID not found in subscription data');
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found for subscription renewal');
        return;
      }

      // Extend subscription by 30 days
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);

      user.subscriptionStatus = 'active';
      user.subscriptionExpiresAt = newExpiryDate;
      await user.save();

      console.log('Subscription renewed for user:', userId);
    } catch (error) {
      console.error('Error handling subscription renewal:', error);
    }
  }

  /**
   * Handle subscription cancellation
   */
  async handleSubscriptionCancellation(subscriptionData) {
    try {
      const userId = subscriptionData.metadata?.userId;

      if (!userId) {
        console.error('User ID not found in subscription data');
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found for subscription cancellation');
        return;
      }

      user.subscriptionStatus = 'cancelled';
      await user.save();

      console.log('Subscription cancelled for user:', userId);
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
    }
  }

  /**
   * Process refund within 7-day window
   */
  async processRefund(paymentId, reason, requestedBy) {
    try {
      const payment = await Payment.findById(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === 'refunded') {
        throw new Error('Payment already refunded');
      }

      // Check if within 7-day refund window
      const daysSincePayment = Math.floor(
        (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSincePayment > 7) {
        throw new Error('Refund window expired (7 days)');
      }

      let refundResult;

      if (payment.provider === 'razorpay') {
        // Process Razorpay refund
        refundResult = await this.razorpay.payments.refund(
          payment.providerPaymentId,
          {
            amount: payment.amount * 100, // Convert to paise
            notes: {
              reason,
              requestedBy
            }
          }
        );
      } else if (payment.provider === 'stripe') {
        // Process Stripe refund
        refundResult = await this.stripe.refunds.create({
          payment_intent: payment.providerPaymentId,
          reason: 'requested_by_customer',
          metadata: {
            reason,
            requestedBy
          }
        });
      }

      // Update payment record
      payment.status = 'refunded';
      payment.refundReason = reason;
      payment.refundedAt = new Date();
      await payment.save();

      // Downgrade user account
      const user = await User.findById(payment.userId);
      if (user) {
        user.userTier = 'free';
        user.subscriptionStatus = 'cancelled';
        user.subscriptionExpiresAt = null;
        await user.save();

        // Send refund confirmation email
        await emailService.sendRefundConfirmation(user, payment);
      }

      return {
        success: true,
        refundId: refundResult.id,
        payment
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get refund rate for monitoring
   */
  async getRefundRate(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const totalPayments = await Payment.countDocuments({
        createdAt: { $gte: startDate },
        status: { $in: ['completed', 'refunded'] }
      });

      const refundedPayments = await Payment.countDocuments({
        createdAt: { $gte: startDate },
        status: 'refunded'
      });

      const refundRate = totalPayments > 0
        ? (refundedPayments / totalPayments) * 100
        : 0;

      return {
        totalPayments,
        refundedPayments,
        refundRate: refundRate.toFixed(2),
        period: `${days} days`,
        alertThreshold: 3,
        shouldAlert: refundRate > 3
      };
    } catch (error) {
      console.error('Error calculating refund rate:', error);
      throw error;
    }
  }

  /**
   * Get payment plans
   */
  getPlans() {
    return Object.values(this.plans).map(plan => ({
      id: plan.id,
      name: plan.name,
      amount: plan.amount / 100,
      currency: plan.currency,
      duration: plan.duration,
      tier: plan.tier
    }));
  }

  /**
   * Get user payment history
   */
  async getUserPayments(userId) {
    try {
      const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

      return payments;
    } catch (error) {
      console.error('Error fetching user payments:', error);
      throw error;
    }
  }
}

export default new PaymentService();
