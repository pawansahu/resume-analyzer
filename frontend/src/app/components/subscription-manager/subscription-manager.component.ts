import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService, Payment } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-subscription-manager',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './subscription-manager.component.html',
  styleUrls: ['./subscription-manager.component.scss']
})
export class SubscriptionManagerComponent implements OnInit {
  loading = false;
  payments: Payment[] = [];
  displayedColumns: string[] = ['date', 'plan', 'amount', 'status', 'actions'];
  currentUser: any = null;

  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadPaymentHistory();
  }

  loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  loadPaymentHistory(): void {
    this.loading = true;
    this.paymentService.getPaymentHistory().subscribe({
      next: (response) => {
        if (response.success) {
          this.payments = response.payments;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.snackBar.open('Failed to load payment history', 'Close', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'primary';
      case 'pending':
        return 'accent';
      case 'failed':
        return 'warn';
      case 'refunded':
        return '';
      default:
        return '';
    }
  }

  canRequestRefund(payment: Payment): boolean {
    if (payment.status !== 'completed') {
      return false;
    }

    const daysSincePayment = Math.floor(
      (Date.now() - new Date(payment.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSincePayment <= 7;
  }

  requestRefund(payment: Payment): void {
    const reason = prompt('Please provide a reason for the refund:');
    
    if (!reason) {
      return;
    }

    this.loading = true;
    this.paymentService.requestRefund(payment._id, reason).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Refund processed successfully', 'Close', {
            duration: 5000
          });
          this.loadPaymentHistory();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Refund error:', error);
        this.snackBar.open(
          error.error?.error || 'Failed to process refund',
          'Close',
          { duration: 5000 }
        );
        this.loading = false;
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatAmount(amount: number, currency: string): string {
    if (currency === 'INR') {
      return `₹${amount}`;
    } else if (currency === 'usd') {
      return `$${amount}`;
    }
    return `${amount} ${currency}`;
  }

  getSubscriptionStatus(): string {
    if (!this.currentUser) {
      return 'No subscription';
    }

    if (this.currentUser.userTier === 'premium') {
      if (this.currentUser.subscriptionStatus === 'active') {
        if (this.currentUser.subscriptionExpiresAt) {
          const expiryDate = new Date(this.currentUser.subscriptionExpiresAt);
          return `Active until ${this.formatDate(expiryDate)}`;
        }
        return 'Active (Lifetime)';
      }
    }

    return 'No active subscription';
  }

  getTierBadgeColor(): string {
    if (!this.currentUser) {
      return '';
    }

    switch (this.currentUser.userTier) {
      case 'premium':
        return 'primary';
      case 'free':
        return 'accent';
      default:
        return '';
    }
  }
}
