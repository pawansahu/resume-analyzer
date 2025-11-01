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
  }

  async selectPlan(plan: any): Promise<void> {
    if (plan.id === 'free') {
      if (!this.isAuthenticated) {
        this.router.navigate(['/auth/register']);
      } else {
        this.router.navigate(['/upload']);
      }
      return;
    }

    if (!this.isAuthenticated) {
      this.snackBar.open('Please login to purchase a plan', 'Close', {
        duration: 3000
      });
      this.router.navigate(['/auth/login']);
      return;
    }

    await this.initiatePayment(plan.planId);
  }

  async initiatePayment(planId: string): Promise<void> {
    try {
      this.loading = true;

      // Load Razorpay script
      const scriptLoaded = await this.paymentService.loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create payment intent
      this.paymentService.createPaymentIntent(planId, 'razorpay').subscribe({
        next: (response) => {
          if (response.success) {
            this.openRazorpayCheckout(response.paymentIntent);
          }
        },
        error: (error) => {
          console.error('Payment intent error:', error);
          this.snackBar.open(
            error.error?.error || 'Failed to initiate payment',
            'Close',
            { duration: 5000 }
          );
          this.loading = false;
        }
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      this.snackBar.open(error.message || 'Payment failed', 'Close', {
        duration: 5000
      });
      this.loading = false;
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
          this.loading = false;
          this.snackBar.open('Payment cancelled', 'Close', { duration: 3000 });
        }
      },
      theme: {
        color: '#3f51b5'
      }
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
  }

  verifyPayment(orderId: string, paymentId: string, signature: string): void {
    this.paymentService
      .verifyRazorpayPayment(orderId, paymentId, signature)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.snackBar.open(
              'Payment successful! Your account has been upgraded.',
              'Close',
              { duration: 5000 }
            );
            // Refresh user data
            this.authService.refreshUserData();
            // Navigate to dashboard
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 2000);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Payment verification error:', error);
          this.snackBar.open(
            'Payment verification failed. Please contact support.',
            'Close',
            { duration: 5000 }
          );
        }
      });
  }
}
