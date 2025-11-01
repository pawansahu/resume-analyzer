import { Queue, Worker } from 'bullmq';
import cron from 'node-cron';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Redis from 'ioredis';
import emailService from './email.service.js';

class SubscriptionLifecycleService {
  constructor() {
    try {
      // Initialize Redis connection for BullMQ
      this.connection = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        retryStrategy: (times) => {
          // Stop retrying after 3 attempts
          if (times > 3) {
            console.warn('⚠️  Redis connection failed. Subscription lifecycle features disabled.');
            return null;
          }
          return Math.min(times * 100, 3000);
        }
      });

      // Handle Redis connection errors
      this.connection.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
          console.warn('⚠️  Redis not available. Subscription lifecycle features will be disabled.');
          console.warn('   To enable: Install and start Redis (see PAYMENT_INTEGRATION_QUICK_START.md)');
        }
      });

      this.connection.on('connect', () => {
        console.log('✅ Redis connected for subscription lifecycle');
      });

      // Create queue for subscription tasks
      this.subscriptionQueue = new Queue('subscription-lifecycle', {
        connection: this.connection
      });

      // Initialize worker
      this.initializeWorker();

      // Schedule cron jobs
      this.scheduleCronJobs();
    } catch (error) {
      console.warn('⚠️  Failed to initialize subscription lifecycle service:', error.message);
      console.warn('   Subscription lifecycle features will be disabled.');
    }
  }

  /**
   * Initialize worker to process subscription tasks
   */
  initializeWorker() {
    this.worker = new Worker(
      'subscription-lifecycle',
      async (job) => {
        switch (job.name) {
          case 'check-expiring-subscriptions':
            await this.checkExpiringSubscriptions();
            break;
          case 'process-expired-subscriptions':
            await this.processExpiredSubscriptions();
            break;
          case 'check-grace-period':
            await this.checkGracePeriod();
            break;
          case 'monitor-refund-rate':
            await this.monitorRefundRate();
            break;
          default:
            console.log('Unknown job type:', job.name);
        }
      },
      { connection: this.connection }
    );

    this.worker.on('completed', (job) => {
      console.log(`Job ${job.name} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.name} failed:`, err);
    });
  }

  /**
   * Schedule cron jobs for subscription management
   */
  scheduleCronJobs() {
    // Check for expiring subscriptions daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily subscription expiry check...');
      await this.subscriptionQueue.add('check-expiring-subscriptions', {});
    });

    // Process expired subscriptions daily at 10 AM
    cron.schedule('0 10 * * *', async () => {
      console.log('Processing expired subscriptions...');
      await this.subscriptionQueue.add('process-expired-subscriptions', {});
    });

    // Check grace period daily at 11 AM
    cron.schedule('0 11 * * *', async () => {
      console.log('Checking grace period subscriptions...');
      await this.subscriptionQueue.add('check-grace-period', {});
    });

    // Monitor refund rate daily at 8 PM
    cron.schedule('0 20 * * *', async () => {
      console.log('Monitoring refund rate...');
      await this.subscriptionQueue.add('monitor-refund-rate', {});
    });

    console.log('Subscription lifecycle cron jobs scheduled');
  }

  /**
   * Check for subscriptions expiring in 7 days and send notifications
   */
  async checkExpiringSubscriptions() {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const eightDaysFromNow = new Date();
      eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

      const expiringUsers = await User.find({
        subscriptionStatus: 'active',
        subscriptionExpiresAt: {
          $gte: sevenDaysFromNow,
          $lt: eightDaysFromNow
        }
      });

      console.log(`Found ${expiringUsers.length} subscriptions expiring in 7 days`);

      for (const user of expiringUsers) {
        await this.sendExpiryWarningEmail(user);
      }

      return {
        success: true,
        count: expiringUsers.length
      };
    } catch (error) {
      console.error('Error checking expiring subscriptions:', error);
      throw error;
    }
  }

  /**
   * Process expired subscriptions and downgrade accounts
   */
  async processExpiredSubscriptions() {
    try {
      const now = new Date();

      const expiredUsers = await User.find({
        subscriptionStatus: 'active',
        subscriptionExpiresAt: { $lt: now }
      });

      console.log(`Found ${expiredUsers.length} expired subscriptions`);

      for (const user of expiredUsers) {
        // Check if in grace period (3 days)
        const gracePeriodEnd = new Date(user.subscriptionExpiresAt);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

        if (now < gracePeriodEnd) {
          // Still in grace period
          console.log(`User ${user.email} is in grace period`);
          await this.sendGracePeriodEmail(user, gracePeriodEnd);
        } else {
          // Grace period expired, downgrade account
          console.log(`Downgrading user ${user.email} after grace period`);
          await this.downgradeAccount(user);
        }
      }

      return {
        success: true,
        count: expiredUsers.length
      };
    } catch (error) {
      console.error('Error processing expired subscriptions:', error);
      throw error;
    }
  }

  /**
   * Check grace period and send reminders
   */
  async checkGracePeriod() {
    try {
      const now = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const gracePeriodUsers = await User.find({
        subscriptionStatus: 'active',
        subscriptionExpiresAt: {
          $gte: threeDaysAgo,
          $lt: now
        }
      });

      console.log(`Found ${gracePeriodUsers.length} users in grace period`);

      for (const user of gracePeriodUsers) {
        await this.sendGracePeriodReminderEmail(user);
      }

      return {
        success: true,
        count: gracePeriodUsers.length
      };
    } catch (error) {
      console.error('Error checking grace period:', error);
      throw error;
    }
  }

  /**
   * Downgrade user account after subscription expiry
   */
  async downgradeAccount(user) {
    try {
      user.userTier = 'free';
      user.subscriptionStatus = 'expired';
      user.usageCount = 0;
      user.dailyUsageResetAt = new Date();

      await user.save();

      // Send downgrade notification email
      await this.sendDowngradeEmail(user);

      console.log(`Account downgraded for user: ${user.email}`);
    } catch (error) {
      console.error('Error downgrading account:', error);
      throw error;
    }
  }

  /**
   * Monitor refund rate and alert if > 3%
   */
  async monitorRefundRate() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const totalPayments = await Payment.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
        status: { $in: ['completed', 'refunded'] }
      });

      const refundedPayments = await Payment.countDocuments({
        createdAt: { $gte: thirtyDaysAgo },
        status: 'refunded'
      });

      const refundRate = totalPayments > 0 
        ? (refundedPayments / totalPayments) * 100 
        : 0;

      console.log(`Refund rate: ${refundRate.toFixed(2)}% (${refundedPayments}/${totalPayments})`);

      if (refundRate > 3) {
        await this.sendRefundRateAlert(refundRate, refundedPayments, totalPayments);
      }

      return {
        success: true,
        refundRate: refundRate.toFixed(2),
        totalPayments,
        refundedPayments,
        alertSent: refundRate > 3
      };
    } catch (error) {
      console.error('Error monitoring refund rate:', error);
      throw error;
    }
  }

  /**
   * Send expiry warning email (7 days before)
   */
  async sendExpiryWarningEmail(user) {
    try {
      await emailService.sendExpiryWarning(user);
      console.log(`Expiry warning sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending expiry warning email:', error);
    }
  }

  /**
   * Send grace period email
   */
  async sendGracePeriodEmail(user, gracePeriodEnd) {
    try {
      await emailService.sendGracePeriodNotification(user, gracePeriodEnd);
      console.log(`Grace period notification sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending grace period email:', error);
    }
  }

  /**
   * Send grace period reminder email
   */
  async sendGracePeriodReminderEmail(user) {
    try {
      const daysUntilExpiry = Math.ceil(
        (new Date(user.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      await emailService.sendRenewalReminder(user, daysUntilExpiry);
      console.log(`Grace period reminder sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending grace period reminder:', error);
    }
  }

  /**
   * Send downgrade notification email
   */
  async sendDowngradeEmail(user) {
    try {
      await emailService.sendDowngradeNotification(user);
      console.log(`Downgrade notification sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending downgrade email:', error);
    }
  }

  /**
   * Send refund rate alert to admins
   */
  async sendRefundRateAlert(refundRate, refundedPayments, totalPayments) {
    try {
      await emailService.sendRefundRateAlert(refundRate, refundedPayments, totalPayments);
      console.log(`Refund rate alert sent: ${refundRate.toFixed(2)}%`);
    } catch (error) {
      console.error('Error sending refund rate alert:', error);
    }
  }

  /**
   * Manually trigger subscription renewal (for testing)
   */
  async triggerSubscriptionRenewal(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.subscriptionStatus !== 'active') {
        throw new Error('User does not have an active subscription');
      }

      // Extend subscription by 30 days
      const newExpiryDate = new Date(user.subscriptionExpiresAt || new Date());
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);
      
      user.subscriptionExpiresAt = newExpiryDate;
      await user.save();

      console.log(`Subscription renewed for user: ${user.email}`);

      return {
        success: true,
        newExpiryDate
      };
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  }

  /**
   * Close connections gracefully
   */
  async close() {
    await this.worker.close();
    await this.subscriptionQueue.close();
    await this.connection.quit();
    console.log('Subscription lifecycle service closed');
  }
}

export default new SubscriptionLifecycleService();
