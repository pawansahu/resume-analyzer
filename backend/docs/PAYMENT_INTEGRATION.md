# Payment Integration Guide

## Overview

The Resume Analyzer payment system supports both Razorpay (for Indian users) and Stripe (for international users). It includes subscription management, refund processing, and automated lifecycle management.

## Payment Plans

### Available Plans

1. **Free Plan**
   - Price: ₹0
   - Features: 3 analyses per day, basic ATS score, watermarked reports
   - No payment required

2. **One-Time Premium**
   - Price: ₹99 (one-time)
   - Plan ID: `one-time`
   - Features: Lifetime premium access
   - No expiry

3. **Monthly Subscription**
   - Price: ₹499/month
   - Plan ID: `monthly`
   - Features: Unlimited analyses, AI features
   - Auto-renewal every 30 days

## API Endpoints

### Get Payment Plans
```
GET /api/payments/plans
```

### Create Payment Intent
```
POST /api/payments/create-intent
Authorization: Bearer <token>

Body:
{
  "planId": "one-time" | "monthly",
  "provider": "razorpay" | "stripe"
}
```

### Verify Razorpay Payment
```
POST /api/payments/verify-razorpay
Authorization: Bearer <token>

Body:
{
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "signature": "signature_xxx"
}
```

### Confirm Stripe Payment
```
POST /api/payments/confirm-stripe
Authorization: Bearer <token>

Body:
{
  "paymentIntentId": "pi_xxx"
}
```

### Request Refund
```
POST /api/payments/refund
Authorization: Bearer <token>

Body:
{
  "paymentId": "payment_id",
  "reason": "Reason for refund"
}
```

### Get Payment History
```
GET /api/payments/history
Authorization: Bearer <token>
```

### Get Refund Rate (Admin Only)
```
GET /api/payments/refund-rate?days=30
Authorization: Bearer <admin_token>
```

## Webhooks

### Razorpay Webhook
```
POST /api/payments/webhook/razorpay
X-Razorpay-Signature: <signature>
```

### Stripe Webhook
```
POST /api/payments/webhook/stripe
Stripe-Signature: <signature>
```

## Subscription Lifecycle Management

### Automated Jobs

1. **Daily Expiry Check (9 AM)**
   - Checks for subscriptions expiring in 7 days
   - Sends expiry warning emails

2. **Process Expired Subscriptions (10 AM)**
   - Identifies expired subscriptions
   - Applies 3-day grace period
   - Downgrades accounts after grace period

3. **Grace Period Check (11 AM)**
   - Sends reminders to users in grace period

4. **Refund Rate Monitor (8 PM)**
   - Calculates refund rate for last 30 days
   - Sends alert if rate exceeds 3%

### Grace Period

- Duration: 3 days after subscription expiry
- Users retain premium access during grace period
- Reminder emails sent daily
- Automatic downgrade after grace period ends

### Refund Policy

- Window: 7 days from payment date
- Automatic account downgrade on refund
- Refund confirmation email sent
- Admin alert if refund rate > 3%

## Environment Variables

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Redis Configuration (for background jobs)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration
EMAIL_PROVIDER=console
EMAIL_FROM=noreply@resumeanalyzer.com
ADMIN_EMAIL=admin@resumeanalyzer.com

# Frontend URL
FRONTEND_URL=http://localhost:4200
```

## Frontend Integration

### Razorpay Integration

```typescript
// Load Razorpay script
await this.paymentService.loadRazorpayScript();

// Create payment intent
const response = await this.paymentService.createPaymentIntent('one-time', 'razorpay');

// Open Razorpay checkout
const options = {
  key: response.paymentIntent.keyId,
  amount: response.paymentIntent.amount,
  currency: response.paymentIntent.currency,
  order_id: response.paymentIntent.orderId,
  handler: (response) => {
    // Verify payment
    this.paymentService.verifyRazorpayPayment(
      response.razorpay_order_id,
      response.razorpay_payment_id,
      response.razorpay_signature
    );
  }
};

const razorpay = new Razorpay(options);
razorpay.open();
```

### Stripe Integration

```typescript
// Load Stripe script
await this.paymentService.loadStripeScript();

// Create payment intent
const response = await this.paymentService.createPaymentIntent('monthly', 'stripe');

// Initialize Stripe
const stripe = Stripe(publishableKey);

// Confirm payment
const result = await stripe.confirmCardPayment(response.paymentIntent.clientSecret);

// Confirm on backend
if (result.paymentIntent.status === 'succeeded') {
  await this.paymentService.confirmStripePayment(result.paymentIntent.id);
}
```

## Email Notifications

### User Emails

1. **Payment Confirmation**
   - Sent immediately after successful payment
   - Includes payment details and plan information

2. **Expiry Warning (7 days before)**
   - Reminds user to renew subscription
   - Includes renewal link

3. **Grace Period Notification**
   - Sent when subscription expires
   - Explains 3-day grace period

4. **Grace Period Reminder**
   - Daily reminders during grace period

5. **Account Downgrade**
   - Sent after grace period ends
   - Explains downgrade and upgrade options

6. **Payment Failure**
   - Sent when payment fails
   - Includes retry instructions

7. **Refund Confirmation**
   - Sent when refund is processed
   - Includes refund details

### Admin Emails

1. **High Refund Rate Alert**
   - Sent when refund rate exceeds 3%
   - Includes statistics and dashboard link

## Testing

### Test Payment Flow

1. Use Razorpay test mode credentials
2. Test card numbers:
   - Success: 4111 1111 1111 1111
   - Failure: 4000 0000 0000 0002

### Test Subscription Lifecycle

```javascript
// Manually trigger subscription check
await subscriptionLifecycle.checkExpiringSubscriptions();

// Manually process expired subscriptions
await subscriptionLifecycle.processExpiredSubscriptions();

// Manually renew subscription
await subscriptionLifecycle.triggerSubscriptionRenewal(userId);
```

## Security Considerations

1. **Webhook Verification**
   - All webhooks verified using signatures
   - Invalid signatures rejected

2. **Payment Intent Validation**
   - Payment intents tied to user accounts
   - Amount verification on backend

3. **Refund Window Enforcement**
   - 7-day window strictly enforced
   - Refund requests validated

4. **Rate Limiting**
   - Payment endpoints rate limited
   - Prevents abuse

## Monitoring

### Key Metrics

1. **Payment Success Rate**
   - Track successful vs failed payments
   - Alert on high failure rate

2. **Refund Rate**
   - Monitor refund rate (target < 3%)
   - Alert on threshold breach

3. **Subscription Churn**
   - Track subscription cancellations
   - Analyze churn reasons

4. **Revenue Metrics**
   - Daily/monthly revenue
   - Average revenue per user (ARPU)

## Troubleshooting

### Common Issues

1. **Payment Verification Failed**
   - Check webhook signature
   - Verify payment intent exists
   - Check network connectivity

2. **Subscription Not Renewed**
   - Check cron job execution
   - Verify Redis connection
   - Check payment gateway status

3. **Email Not Sent**
   - Check email service configuration
   - Verify email provider credentials
   - Check email logs

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
DEBUG=payment:*
```

## Support

For payment-related issues:
- Check payment logs in database
- Review webhook delivery in gateway dashboard
- Contact payment gateway support if needed
