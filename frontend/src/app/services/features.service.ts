import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserFeatures {
  // Basic features
  basic_analysis: boolean;
  pdf_reports: boolean;
  email_support: boolean;
  
  // Premium features
  job_description_matching: boolean;
  ai_rewrite: boolean;
  unlimited_analyses: boolean;
  priority_support: boolean;
  advanced_reports: boolean;
  export_formats: boolean;
  
  // User info
  tier: string;
  subscriptionStatus: string;
  usageLimit: number;
}

@Injectable({
  providedIn: 'root'
})
export class FeaturesService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private featuresSubject = new BehaviorSubject<UserFeatures | null>(null);
  public features$ = this.featuresSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFeatures();
  }

  /**
   * Load user features from API
   */
  loadFeatures(): void {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.featuresSubject.next(this.getDefaultFeatures());
      return;
    }

    this.http.get<any>(`${this.apiUrl}/resume/features`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.featuresSubject.next(response.data);
        }
      },
      error: (error) => {
        console.error('Failed to load features:', error);
        this.featuresSubject.next(this.getDefaultFeatures());
      }
    });
  }

  /**
   * Get current features
   */
  getFeatures(): UserFeatures | null {
    return this.featuresSubject.value;
  }

  /**
   * Check if user has a specific feature
   */
  hasFeature(featureName: keyof UserFeatures): boolean {
    const features = this.featuresSubject.value;
    if (!features) return false;
    return features[featureName] === true;
  }

  /**
   * Check if user is premium
   */
  isPremium(): boolean {
    const features = this.featuresSubject.value;
    return features?.tier === 'premium' && features?.subscriptionStatus === 'active';
  }

  /**
   * Check if user is free tier
   */
  isFree(): boolean {
    const features = this.featuresSubject.value;
    return features?.tier === 'free' || !features;
  }

  /**
   * Get usage limit
   */
  getUsageLimit(): number {
    const features = this.featuresSubject.value;
    return features?.usageLimit || 3;
  }

  /**
   * Refresh features (call after subscription changes)
   */
  refresh(): void {
    this.loadFeatures();
  }

  /**
   * Clear features (call on logout)
   */
  clear(): void {
    this.featuresSubject.next(this.getDefaultFeatures());
  }

  /**
   * Get default features for free/anonymous users
   */
  private getDefaultFeatures(): UserFeatures {
    return {
      basic_analysis: true,
      pdf_reports: true,
      email_support: true,
      job_description_matching: false,
      ai_rewrite: false,
      unlimited_analyses: false,
      priority_support: false,
      advanced_reports: false,
      export_formats: false,
      tier: 'free',
      subscriptionStatus: 'none',
      usageLimit: 3
    };
  }
}
