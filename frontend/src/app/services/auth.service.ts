import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userTier: string;
  usageCount: number;
  dailyUsageResetAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Load user from localStorage on init
    this.loadUserFromStorage();
  }

  /**
   * Register a new user
   */
  register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData).pipe(
      tap(response => {
        if (response.success) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  /**
   * Login user
   */
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get access token
   */
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(data: { user: User; accessToken: string; refreshToken: string }): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    this.currentUserSubject.next(data.user);
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        this.logout();
      }
    }
  }

  /**
   * Refresh user data from server
   */
  refreshUserData(): void {
    // Re-fetch user profile to get updated tier and subscription info
    this.http.get<{ success: boolean; user: User }>(`${this.apiUrl}/auth/profile`).subscribe({
      next: (response) => {
        if (response.success && response.user) {
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      },
      error: (error) => {
        console.error('Error refreshing user data:', error);
      }
    });
  }
}
