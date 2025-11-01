import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PaymentPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  duration: string;
  tier: string;
}

export interface PaymentIntent {
  orderId?: string;
  amount: number;
  currency: string;
  keyId?: string;
  clientSecret?: string;
  paymentIntentId?: string;
  planName: string;
  paymentId: string;
}

export interface Payment {
  _id: string;
  userId: string;
  provider: 'razorpay' | 'stripe';
  providerPaymentId: string;
  amount: number;
  currency: string;
  planId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  refundReason?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;
  private paymentStatusSubject = new BehaviorSubject<string | null>(null);
  public paymentStatus$ = this.paymentStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get available payment plans
   */
  getPlans(): Observable<{ success: boolean; plans: PaymentPlan[] }> {
    return this.http.get<{ success: boolean; plans: PaymentPlan[] }>(
      `${this.apiUrl}/plans`
    );
  }

  /**
   * Create payment intent
   */
  createPaymentIntent(
    planId: string,
    provider: 'razorpay' | 'stripe' = 'razorpay'
  ): Observable<{ success: boolean; paymentIntent: PaymentIntent }> {
    return this.http.post<{ success: boolean; paymentIntent: PaymentIntent }>(
      `${this.apiUrl}/create-intent`,
      { planId, provider }
    );
  }

  /**
   * Verify Razorpay payment
   */
  verifyRazorpayPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Observable<{ success: boolean; message: string; payment: Payment }> {
    return this.http.post<{ success: boolean; message: string; payment: Payment }>(
      `${this.apiUrl}/verify-razorpay`,
      { orderId, paymentId, signature }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.paymentStatusSubject.next('success');
        }
      })
    );
  }

  /**
   * Confirm Stripe payment
   */
  confirmStripePayment(
    paymentIntentId: string
  ): Observable<{ success: boolean; message: string; payment: Payment }> {
    return this.http.post<{ success: boolean; message: string; payment: Payment }>(
      `${this.apiUrl}/confirm-stripe`,
      { paymentIntentId }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.paymentStatusSubject.next('success');
        }
      })
    );
  }

  /**
   * Request refund
   */
  requestRefund(
    paymentId: string,
    reason: string
  ): Observable<{ success: boolean; message: string; refund: any }> {
    return this.http.post<{ success: boolean; message: string; refund: any }>(
      `${this.apiUrl}/refund`,
      { paymentId, reason }
    );
  }

  /**
   * Get payment history
   */
  getPaymentHistory(): Observable<{ success: boolean; payments: Payment[] }> {
    return this.http.get<{ success: boolean; payments: Payment[] }>(
      `${this.apiUrl}/history`
    );
  }

  /**
   * Clear payment status
   */
  clearPaymentStatus(): void {
    this.paymentStatusSubject.next(null);
  }

  /**
   * Load Razorpay script
   */
  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  /**
   * Load Stripe script
   */
  loadStripeScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).Stripe) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
}
