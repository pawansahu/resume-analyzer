import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Get user profile
   */
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`).pipe(
      catchError(error => {
        console.error('Get profile error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update user profile
   */
  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, profileData).pipe(
      catchError(error => {
        console.error('Update profile error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Change password
   */
  changePassword(passwordData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile/password`, passwordData).pipe(
      catchError(error => {
        console.error('Change password error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profileImage', file);

    return this.http.post(`${this.apiUrl}/profile/picture`, formData).pipe(
      catchError(error => {
        console.error('Upload profile picture error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete account
   */
  deleteAccount(password: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/profile`, {
      body: { password }
    }).pipe(
      catchError(error => {
        console.error('Delete account error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create Stripe billing portal session
   */
  createBillingPortal(returnUrl: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/billing-portal`, { returnUrl }).pipe(
      catchError(error => {
        console.error('Create billing portal error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/cancel-subscription`, { reason }).pipe(
      catchError(error => {
        console.error('Cancel subscription error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get subscription details
   */
  getSubscriptionDetails(): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/subscription`).pipe(
      catchError(error => {
        console.error('Get subscription details error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get subscription history
   */
  getSubscriptionHistory(): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/history`).pipe(
      catchError(error => {
        console.error('Get subscription history error:', error);
        return throwError(() => error);
      })
    );
  }
}
