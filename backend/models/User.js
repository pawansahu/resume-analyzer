import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  userTier: {
    type: String,
    enum: ['anonymous', 'free', 'premium', 'admin'],
    default: 'free'
  },
  subscriptionId: {
    type: String
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: null
  },
  subscriptionExpiresAt: {
    type: Date
  },
  lastLitePurchaseDate: {
    type: Date
  },
  stripeCustomerId: {
    type: String
  },
  stripeSubscriptionId: {
    type: String
  },
  razorpayCustomerId: {
    type: String
  },
  razorpaySubscriptionId: {
    type: String
  },
  paymentProvider: {
    type: String,
    enum: ['razorpay', 'stripe', null],
    default: null
  },
  cancellationReason: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  },
  dailyUsageResetAt: {
    type: Date,
    default: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
  },
  lastLoginAt: {
    type: Date
  },
  profileImage: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ userTier: 1 });
userSchema.index({ subscriptionStatus: 1 });

const User = mongoose.model('User', userSchema);

export default User;
