/**
 * Email Service
 * Handles sending emails for various events
 * TODO: Integrate with SendGrid or Resend API
 */

class EmailService {
  constructor() {
    this.emailProvider = process.env.EMAIL_PROVIDER || 'console'; // 'sendgrid', 'resend', or 'console'
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@resumeanalyzer.com';
  }

  /**
   * Send email (generic method)
   */
  async sendEmail(to, subject, template, data) {
    try {
      if (this.emailProvider === 'console') {
        // For development - just log to console
        console.log('\n=== EMAIL ===');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Template: ${template}`);
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('=============\n');
        return { success: true, provider: 'console' };
      }

      // TODO: Implement actual email sending with SendGrid/Resend
      if (this.emailProvider === 'sendgrid') {
        return await this.sendWithSendGrid(to, subject, template, data);
      }

      if (this.emailProvider === 'resend') {
        return await this.sendWithResend(to, subject, template, data);
      }

      throw new Error('Invalid email provider');
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email on registration
   */
  async sendWelcomeEmail(user) {
    return this.sendEmail(
      user.email,
      'Welcome to Resume Analyzer',
      'welcome',
      {
        name: user.firstName || 'User',
        email: user.email
      }
    );
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(user, payment) {
    return this.sendEmail(
      user.email,
      'Payment Confirmation - Resume Analyzer',
      'payment-confirmation',
      {
        name: user.firstName || 'User',
        amount: payment.amount,
        currency: payment.currency,
        planId: payment.planId,
        date: payment.createdAt
      }
    );
  }

  /**
   * Send subscription renewal reminder (3 days before)
   */
  async sendRenewalReminder(user, daysUntilExpiry) {
    return this.sendEmail(
      user.email,
      'Your subscription is expiring soon',
      'renewal-reminder',
      {
        name: user.firstName || 'User',
        expiryDate: user.subscriptionExpiresAt,
        daysUntilExpiry
      }
    );
  }

  /**
   * Send payment failure notification
   */
  async sendPaymentFailure(user, payment) {
    return this.sendEmail(
      user.email,
      'Payment Failed - Action Required',
      'payment-failure',
      {
        name: user.firstName || 'User',
        amount: payment.amount,
        currency: payment.currency,
        retryUrl: `${process.env.FRONTEND_URL}/pricing`
      }
    );
  }

  /**
   * Send subscription expiry warning (7 days before)
   */
  async sendExpiryWarning(user) {
    return this.sendEmail(
      user.email,
      'Your subscription is expiring in 7 days',
      'expiry-warning',
      {
        name: user.firstName || 'User',
        expiryDate: user.subscriptionExpiresAt,
        renewUrl: `${process.env.FRONTEND_URL}/pricing`
      }
    );
  }

  /**
   * Send grace period notification
   */
  async sendGracePeriodNotification(user, gracePeriodEnd) {
    return this.sendEmail(
      user.email,
      'Your subscription has expired - Grace period active',
      'grace-period',
      {
        name: user.firstName || 'User',
        gracePeriodEnd,
        renewUrl: `${process.env.FRONTEND_URL}/pricing`
      }
    );
  }

  /**
   * Send account downgrade notification
   */
  async sendDowngradeNotification(user) {
    return this.sendEmail(
      user.email,
      'Your account has been downgraded',
      'account-downgrade',
      {
        name: user.firstName || 'User',
        upgradeUrl: `${process.env.FRONTEND_URL}/pricing`
      }
    );
  }

  /**
   * Send refund confirmation
   */
  async sendRefundConfirmation(user, payment) {
    return this.sendEmail(
      user.email,
      'Refund Processed - Resume Analyzer',
      'refund-confirmation',
      {
        name: user.firstName || 'User',
        amount: payment.amount,
        currency: payment.currency,
        refundDate: payment.refundedAt
      }
    );
  }

  /**
   * Send admin alert for high refund rate
   */
  async sendRefundRateAlert(refundRate, refundedPayments, totalPayments) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@resumeanalyzer.com';
    
    return this.sendEmail(
      adminEmail,
      'ALERT: High Refund Rate Detected',
      'refund-rate-alert',
      {
        refundRate,
        refundedPayments,
        totalPayments,
        threshold: 3,
        dashboardUrl: `${process.env.FRONTEND_URL}/admin/dashboard`
      }
    );
  }

  /**
   * Send with SendGrid (placeholder)
   */
  async sendWithSendGrid(to, subject, template, data) {
    // TODO: Implement SendGrid integration
    console.log('SendGrid integration not yet implemented');
    return { success: false, error: 'Not implemented' };
  }

  /**
   * Send with Resend (placeholder)
   */
  async sendWithResend(to, subject, template, data) {
    // TODO: Implement Resend integration
    console.log('Resend integration not yet implemented');
    return { success: false, error: 'Not implemented' };
  }
}

export default new EmailService();
