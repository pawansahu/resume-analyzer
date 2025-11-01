import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';

declare var Razorpay: any;

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent implements OnInit {
  loading = false;
  isAuthenticated = false;
  loadingPlanId: string | null = null; // Track which plan is loading
  currentUser: any = null;

  plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for trying out',
      features: [
        '3 analyses per day',
        'Basic ATS score',
        'Keyword matching',
        'Watermarked reports',
        'Email support'
      ],
      limitations: [
        'No AI rewrite',
        'No cover letter generation',
        'Limited features'
      ],
      buttonText: 'Get Started',
      buttonColor: 'primary',
      popular: false,
      planId: null
    },
    {
      id: 'one-time',
      name: 'Lite',
      price: '₹99',
      period: 'one-time',
      description: 'One-time full analysis',
      features: [
        'Complete ATS analysis',
        'Job description matching',
        'Detailed recommendations',
        'Full PDF report',
        'Priority support'
      ],
      limitations: [],
      buttonText: 'Buy Now',
      buttonColor: 'accent',
      popular: false,
      planId: 'one-time'
    },
    {
      id: 'monthly',
      name: 'Pro',
      price: '₹499',
      period: 'per month',
      description: 'Best for job seekers',
      features: [
        'Unlimited analyses',
        'AI-powered rewrite',
        'Cover letter generation',
        'JD matching',
        'No watermarks',
        'Priority support',
        'Advanced insights'
      ],
      limitations: [],
      buttonText: 'Subscribe Now',
      buttonColor: 'accent',
      popular: true,
      planId: 'monthly'
    }
  ];

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    
    // Subscribe to current user to check eligibility
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  async selectPlan(plan: any): Promise<void> {
    if (plan.id === 'free') {
      // Check if user has purchased any paid plan
      if (this.isAuthenticated && this.currentUser && this.hasPurchasedPaidPlan()) {
        this.snackBar.open('You already have a paid plan. Free plan is not available.', 'Close', {
          duration: 3000
        });
        return;
      }

      if (!this.isAuthenticated) {
        this.router.navigate(['/register']);
      } else {
        this.router.navigate(['/upload']);
      }
      return;
    }

    if (!this.isAuthenticated) {
      this.snackBar.open('Please login to purchase a plan', 'Close', {
        duration: 3000
      });
      this.router.navigate(['/login']);
      return;
    }

    this.loadingPlanId = plan.id; // Set which plan is loading
    await this.initiatePayment(plan.planId);
  }

  async initiatePayment(planId: string): Promise<void> {
    try {
      console.log('Initiating payment for plan:', planId);

      // Load Razorpay script
      console.log('Loading Razorpay script...');
      const scriptLoaded = await this.paymentService.loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please check your internet connection.');
      }
      console.log('Razorpay script loaded successfully');

      // Create payment intent
      console.log('Creating payment intent...');
      this.paymentService.createPaymentIntent(planId, 'razorpay').subscribe({
        next: (response) => {
          console.log('Payment intent response:', response);
          if (response.success) {
            this.openRazorpayCheckout(response.paymentIntent);
          } else {
            throw new Error('Invalid payment intent response');
          }
        },
        error: (error) => {
          console.error('Payment intent error:', error);
          let errorMessage = 'Failed to initiate payment';
          
          if (error.status === 401) {
            errorMessage = 'Please login to continue';
          } else if (error.status === 400) {
            errorMessage = error.error?.error || 'Invalid payment request';
          } else if (error.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.error?.error) {
            errorMessage = error.error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          this.loadingPlanId = null;
        }
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      this.snackBar.open(error.message || 'Payment failed', 'Close', {
        duration: 5000
      });
      this.loadingPlanId = null;
    }
  }

  openRazorpayCheckout(paymentIntent: any): void {
    const options = {
      key: paymentIntent.keyId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      name: 'Resume Analyzer',
      description: paymentIntent.planName,
      order_id: paymentIntent.orderId,
      handler: (response: any) => {
        this.verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
      },
      modal: {
        ondismiss: () => {
          this.loadingPlanId = null;
          this.snackBar.open('Payment cancelled', 'Close', { duration: 3000 });
        }
      },
      theme: {
        color: '#667eea'
      }
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
  }

  verifyPayment(orderId: string, paymentId: string, signature: string): void {
    console.log('Verifying payment...', { orderId, paymentId });
    
    this.paymentService
      .verifyRazorpayPayment(orderId, paymentId, signature)
      .subscribe({
        next: (response) => {
          console.log('Payment verification response:', response);
          this.loadingPlanId = null;
          
          if (response.success) {
            // Show success message
            this.snackBar.open(
              'Payment successful! Redirecting to dashboard...',
              'Close',
              { duration: 3000 }
            );
            
            console.log('Payment successful, refreshing user data...');
            
            // Refresh user data
            this.authService.refreshUserData();
            
            // Navigate to dashboard immediately
            console.log('Redirecting to dashboard...');
            setTimeout(() => {
              this.router.navigate(['/dashboard']).then(
                (success) => {
                  console.log('Navigation to dashboard successful:', success);
                  // Reload the page to ensure all data is fresh
                  window.location.reload();
                },
                (error) => console.error('Navigation error:', error)
              );
            }, 1500);
          } else {
            console.error('Payment verification failed:', response);
            this.snackBar.open(
              'Payment verification failed. Please contact support.',
              'Close',
              { duration: 5000 }
            );
          }
        },
        error: (error) => {
          this.loadingPlanId = null;
          console.error('Payment verification error:', error);
          this.snackBar.open(
            'Payment verification failed. Please contact support.',
            'Close',
            { duration: 5000 }
          );
        }
      });
  }

  // Helper method to check if a specific plan is loading
  isPlanLoading(planId: string): boolean {
    return this.loadingPlanId === planId;
  }

  // Check if user has purchased any paid plan
  hasPurchasedPaidPlan(): boolean {
    if (!this.currentUser) {
      return false;
    }

    const now = new Date();

    // Check if user has Lite purchase (today or any day)
    if (this.currentUser.lastLitePurchaseDate) {
      return true;
    }

    // Check if user has active or expired Pro subscription
    if (this.currentUser.userTier === 'premium') {
      return true;
    }

    return false;
  }

  // Check if user can access a plan
  canAccessPlan(planId: string | null): boolean {
    // For free plan
    if (!planId) {
      // Free plan not available if user has purchased any paid plan
      if (this.isAuthenticated && this.currentUser && this.hasPurchasedPaidPlan()) {
        return false;
      }
      return true;
    }

    // For paid plans, check purchase eligibility
    return this.canPurchasePlan(planId);
  }

  // Check if user can purchase a plan
  canPurchasePlan(planId: string | null): boolean {
    if (!planId || !this.isAuthenticated || !this.currentUser) {
      return true; // Show as available for non-authenticated users
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check for Lite plan
    if (planId === 'one-time') {
      // Cannot buy Lite if user has active Pro subscription
      if (this.currentUser.userTier === 'premium' && 
          this.currentUser.subscriptionStatus === 'active' && 
          this.currentUser.subscriptionExpiresAt && 
          new Date(this.currentUser.subscriptionExpiresAt) > now) {
        return false;
      }

      // Check if already purchased Lite today
      if (this.currentUser.lastLitePurchaseDate) {
        const lastPurchaseDate = new Date(this.currentUser.lastLitePurchaseDate);
        const purchaseDay = new Date(
          lastPurchaseDate.getFullYear(), 
          lastPurchaseDate.getMonth(), 
          lastPurchaseDate.getDate()
        );
        
        if (purchaseDay.getTime() === today.getTime()) {
          return false;
        }
      }
    }

    // Check for Pro plan
    if (planId === 'monthly') {
      // Cannot buy Pro if user already has active Pro subscription
      if (this.currentUser.userTier === 'premium' && 
          this.currentUser.subscriptionStatus === 'active' && 
          this.currentUser.subscriptionExpiresAt && 
          new Date(this.currentUser.subscriptionExpiresAt) > now) {
        return false;
      }
    }

    return true;
  }

  // Get disabled message for a plan
  getDisabledMessage(planId: string | null): string {
    if (!this.isAuthenticated || !this.currentUser) {
      return '';
    }

    // For free plan
    if (!planId) {
      if (this.hasPurchasedPaidPlan()) {
        return 'Not available with paid plan';
      }
      return '';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (planId === 'one-time') {
      // Check Pro subscription
      if (this.currentUser.userTier === 'premium' && 
          this.currentUser.subscriptionStatus === 'active' && 
          this.currentUser.subscriptionExpiresAt && 
          new Date(this.currentUser.subscriptionExpiresAt) > now) {
        return 'You have an active Pro subscription';
      }

      // Check today's Lite purchase
      if (this.currentUser.lastLitePurchaseDate) {
        const lastPurchaseDate = new Date(this.currentUser.lastLitePurchaseDate);
        const purchaseDay = new Date(
          lastPurchaseDate.getFullYear(), 
          lastPurchaseDate.getMonth(), 
          lastPurchaseDate.getDate()
        );
        
        if (purchaseDay.getTime() === today.getTime()) {
          return 'Already purchased today';
        }
      }
    }

    if (planId === 'monthly') {
      if (this.currentUser.userTier === 'premium' && 
          this.currentUser.subscriptionStatus === 'active' && 
          this.currentUser.subscriptionExpiresAt && 
          new Date(this.currentUser.subscriptionExpiresAt) > now) {
        return 'Already subscribed';
      }
    }

    return '';
  }
}
