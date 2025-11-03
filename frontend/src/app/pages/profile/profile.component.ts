import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  loading = false;
  loadingProfile = true;
  uploadingImage = false;
  
  user = {
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    profileImage: '',
    userTier: 'free',
    subscriptionStatus: '',
    cancelledAt: null as Date | null,
    usageCount: 0,
    createdAt: new Date()
  };

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  
  // Subscription history
  subscriptionHistory: any[] = [];
  paginatedHistory: any[] = [];
  loadingHistory = false;
  
  // Pagination
  pageSize = 5;
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phone: [''],
      bio: ['', [Validators.maxLength(500)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadSubscriptionHistory();
  }

  loadUserProfile(): void {
    this.loadingProfile = true;
    this.profileService.getProfile().subscribe({
      next: (response) => {
        if (response.success) {
          const userData = response.data.user;
          this.user = {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || '',
            bio: userData.bio || '',
            profileImage: userData.profileImage || '',
            userTier: userData.userTier,
            subscriptionStatus: userData.subscriptionStatus || '',
            cancelledAt: userData.cancelledAt ? new Date(userData.cancelledAt) : null,
            usageCount: userData.usageCount || 0,
            createdAt: new Date(userData.createdAt)
          };

          this.profileForm.patchValue({
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            email: this.user.email,
            phone: this.user.phone,
            bio: this.user.bio
          });

          this.imagePreview = this.user.profileImage;
        }
        this.loadingProfile = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.loadingProfile = false;
        this.snackBar.open('Failed to load profile', 'Close', {
          duration: 3000
        });
      }
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Please select an image file', 'Close', {
          duration: 3000
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('Image size must be less than 5MB', 'Close', {
          duration: 3000
        });
        return;
      }

      this.selectedFile = file;

      // Preview image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);

      // Upload immediately
      this.uploadProfileImage();
    }
  }

  uploadProfileImage(): void {
    if (!this.selectedFile) return;

    this.uploadingImage = true;
    this.profileService.uploadProfilePicture(this.selectedFile).subscribe({
      next: (response) => {
        if (response.success) {
          this.user.profileImage = response.data.profileImage;
          this.snackBar.open('Profile picture updated successfully!', 'Close', {
            duration: 3000
          });
        }
        this.uploadingImage = false;
        this.selectedFile = null;
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.uploadingImage = false;
        this.snackBar.open('Failed to upload profile picture', 'Close', {
          duration: 3000
        });
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      const profileData = {
        firstName: this.profileForm.value.firstName,
        lastName: this.profileForm.value.lastName,
        phone: this.profileForm.value.phone,
        bio: this.profileForm.value.bio
      };

      this.profileService.updateProfile(profileData).subscribe({
        next: (response) => {
          if (response.success) {
            this.user = { ...this.user, ...response.data.user };
            this.snackBar.open('Profile updated successfully!', 'Close', {
              duration: 3000
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Update error:', error);
          this.loading = false;
          this.snackBar.open(
            error.error?.error?.message || 'Failed to update profile',
            'Close',
            { duration: 3000 }
          );
        }
      });
    }
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      this.loading = true;
      const passwordData = {
        currentPassword: this.passwordForm.value.currentPassword,
        newPassword: this.passwordForm.value.newPassword
      };

      this.profileService.changePassword(passwordData).subscribe({
        next: (response) => {
          if (response.success) {
            this.passwordForm.reset();
            this.snackBar.open('Password changed successfully!', 'Close', {
              duration: 3000
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Password change error:', error);
          this.loading = false;
          this.snackBar.open(
            error.error?.error?.message || 'Failed to change password',
            'Close',
            { duration: 3000 }
          );
        }
      });
    }
  }

  deleteAccount(): void {
    // First confirmation
    const firstConfirm = confirm(
      '⚠️ PERMANENT ACCOUNT DELETION WARNING ⚠️\n\n' +
      'This action will PERMANENTLY delete:\n\n' +
      '✗ Your user account\n' +
      '✗ All resume analyses and reports\n' +
      '✗ All uploaded resume files\n' +
      '✗ Payment and subscription history\n' +
      '✗ Profile information and settings\n' +
      '✗ All saved preferences\n\n' +
      'THIS ACTION CANNOT BE UNDONE!\n\n' +
      'Are you absolutely sure you want to continue?'
    );
    
    if (!firstConfirm) {
      return;
    }

    // Second confirmation
    const secondConfirm = confirm(
      '⚠️ FINAL CONFIRMATION ⚠️\n\n' +
      'This is your last chance to cancel.\n\n' +
      'All your data will be permanently deleted and cannot be recovered.\n\n' +
      'Do you really want to delete your account?'
    );
    
    if (!secondConfirm) {
      return;
    }

    // Password verification
    const password = prompt(
      'Enter your password to confirm account deletion:\n\n' +
      '(This is the final step to permanently delete your account)'
    );
    
    if (!password) {
      return;
    }
    
    this.loading = true;
    console.log('Calling deleteAccount API...');
    
    this.profileService.deleteAccount(password).subscribe({
      next: (response) => {
        console.log('Delete account response:', response);
        
        if (response.success) {
          const deletedData = response.deletedData || {};
          const message = 
            `Account deleted successfully!\n\n` +
            `Deleted:\n` +
            `• ${deletedData.analyses || 0} analyses\n` +
            `• ${deletedData.payments || 0} payments\n` +
            `• ${deletedData.contacts || 0} contacts\n` +
            `• ${deletedData.auditLogs || 0} audit logs`;
          
          console.log('Showing success message and clearing storage...');
          alert(message);
          
          // Clear all local storage data (including subscription data)
          localStorage.clear();
          console.log('localStorage cleared');
          
          // Clear session storage as well
          sessionStorage.clear();
          console.log('sessionStorage cleared');
          
          this.snackBar.open('Account deleted! Redirecting...', 'Close', {
            duration: 2000
          });
          
          // Redirect immediately
          console.log('Redirecting to home page...');
          setTimeout(() => {
            window.location.href = '/';
          }, 500);
        } else {
          console.error('Delete failed - response.success is false');
          this.loading = false;
          this.snackBar.open('Failed to delete account', 'Close', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        console.error('Delete account error:', error);
        console.error('Error details:', error.error);
        this.loading = false;
        
        const errorMessage = error.error?.error?.message || 
                           error.error?.message || 
                           error.message || 
                           'Failed to delete account';
        
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000
        });
      }
    });
  }

  manageBilling(): void {
    // Razorpay doesn't have a customer portal
    // Show subscription details instead
    this.snackBar.open(
      'Manage your subscription by cancelling or upgrading from this page.',
      'Close',
      { duration: 4000 }
    );
  }

  cancelSubscription(): void {
    const confirmed = confirm(
      '⚠️ IMMEDIATE CANCELLATION WARNING ⚠️\n\n' +
      'Your subscription will be cancelled IMMEDIATELY and you will:\n\n' +
      '• Lose ALL premium features instantly\n' +
      '• Be downgraded to the FREE plan\n' +
      '• Lose unlimited analyses (back to 3/day)\n' +
      '• Lose job description matching\n' +
      '• Lose AI rewrite features\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you absolutely sure you want to cancel?'
    );
    
    if (!confirmed) {
      return;
    }

    const reason = prompt('Please tell us why you\'re cancelling (optional):');
    
    // User clicked cancel on reason prompt
    if (reason === null) {
      return;
    }
    
    this.loading = true;
    
    this.profileService.cancelSubscription(reason || 'No reason provided').subscribe({
      next: (response) => {
        if (response.success) {
          // Update local user data immediately to FREE tier
          if (response.user) {
            this.user.userTier = 'free';
            
            // Update auth service with new user data
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            currentUser.userTier = 'free';
            currentUser.subscriptionStatus = 'cancelled';
            currentUser.subscriptionExpiresAt = null;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
          }
          
          this.snackBar.open(
            '❌ ' + (response.message || 'Subscription cancelled. You are now on the FREE plan.'),
            'Close',
            { duration: 6000 }
          );
          
          // Reload profile to get fresh data from server
          setTimeout(() => {
            this.loadUserProfile();
            // Optionally redirect to dashboard to show free tier
            this.router.navigate(['/dashboard']);
          }, 1500);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Cancellation error:', error);
        this.loading = false;
        this.snackBar.open(
          error.error?.error || 'Failed to cancel subscription',
          'Close',
          { duration: 3000 }
        );
      }
    });
  }

  upgradePlan(): void {
    this.router.navigate(['/pricing']);
  }

  getTierBadgeClass(): string {
    return this.user.userTier === 'premium' ? 'premium-badge' : 'free-badge';
  }

  getUsagePercentage(): number {
    const limit = this.user.userTier === 'premium' ? 999 : 3;
    return (this.user.usageCount / limit) * 100;
  }

  getSubscriptionStatus(): string {
    // Check subscription status first
    if (this.user.subscriptionStatus === 'cancelled') {
      return 'Cancelled';
    }
    
    if (this.user.subscriptionStatus === 'expired') {
      return 'Expired';
    }
    
    if (this.user.userTier === 'premium' && this.user.subscriptionStatus === 'active') {
      return 'Active';
    }
    
    if (this.user.userTier === 'free') {
      return 'Free Plan';
    }
    
    return 'Inactive';
  }

  getNextBillingDate(): string {
    // TODO: Get actual billing date from user data
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Check if user should see subscription tab
   * Show if user is premium, was premium, or has subscription history
   */
  hasSubscriptionAccess(): boolean {
    return this.user.userTier === 'premium' || 
           this.user.subscriptionStatus === 'cancelled' ||
           this.user.subscriptionStatus === 'expired' ||
           this.subscriptionHistory.length > 0;
  }

  /**
   * Load subscription history
   */
  loadSubscriptionHistory(): void {
    this.loadingHistory = true;
    this.profileService.getSubscriptionHistory().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.subscriptionHistory = response.data;
          this.totalItems = this.subscriptionHistory.length;
          this.pageIndex = 0;
          this.updatePaginatedHistory();
        }
        this.loadingHistory = false;
      },
      error: (error) => {
        console.error('Failed to load subscription history:', error);
        this.loadingHistory = false;
      }
    });
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'INR'): string {
    if (currency === 'INR') {
      return `₹${amount}`;
    }
    return `$${amount}`;
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'status-badge-success';
      case 'pending':
        return 'status-badge-warning';
      case 'failed':
        return 'status-badge-error';
      case 'refunded':
        return 'status-badge-info';
      default:
        return 'status-badge-default';
    }
  }

  /**
   * Get total amount spent on subscriptions
   */
  getTotalSpent(): string {
    const total = this.subscriptionHistory
      .filter(item => item.status === 'completed')
      .reduce((sum, item) => sum + item.amount, 0);
    return this.formatCurrency(total, 'INR');
  }

  /**
   * Get count of completed subscriptions
   */
  getCompletedCount(): number {
    return this.subscriptionHistory.filter(item => item.status === 'completed').length;
  }

  /**
   * Get subscription end date (30 days from start for monthly)
   */
  getSubscriptionEndDate(startDate: string | Date): string {
    if (!startDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 30); // 30 days subscription period
    return this.formatDate(end);
  }

  /**
   * Get subscription status text
   */
  getSubscriptionStatusText(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'completed':
        return 'Active/Completed';
      case 'pending':
        return 'Pending Activation';
      case 'failed':
        return 'Payment Failed';
      case 'refunded':
        return 'Refunded/Cancelled';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get payment status text
   */
  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  }

  /**
   * Handle page change event
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedHistory();
  }

  /**
   * Update paginated history based on current page
   */
  updatePaginatedHistory(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedHistory = this.subscriptionHistory.slice(startIndex, endIndex);
  }
}
