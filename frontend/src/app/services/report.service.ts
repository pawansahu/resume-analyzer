import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry, tap, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ReportSummary {
  totalScore: number;
  matchPercentage: number | null;
  criticalIssues: number;
  generatedAt: string;
}

export interface ReportData {
  summary: ReportSummary;
  atsScore: {
    total: number;
    breakdown: {
      structure: number;
      keywords: number;
      readability: number;
      formatting: number;
    };
    details: any;
  };
  recommendations: any[];
  jdMatch: any;
  aiSuggestions: any[];
  coverLetter: string | null;
}

export interface ReportGenerationResponse {
  success: boolean;
  data: {
    reportUrl: string;
    expiresAt: string;
    cached: boolean;
  };
}

export interface ReportGenerationStatus {
  status: 'idle' | 'generating' | 'success' | 'error';
  message?: string;
  reportUrl?: string;
  expiresAt?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private generationStatus$ = new BehaviorSubject<ReportGenerationStatus>({ status: 'idle' });

  constructor(private http: HttpClient) {}

  /**
   * Get report generation status observable
   */
  getGenerationStatus(): Observable<ReportGenerationStatus> {
    return this.generationStatus$.asObservable();
  }

  /**
   * Get on-screen report preview
   */
  getReportPreview(analysisId: string): Observable<{ success: boolean; data: ReportData }> {
    return this.http.get<{ success: boolean; data: ReportData }>(
      `${this.apiUrl}/reports/preview/${analysisId}`
    ).pipe(
      retry(2),
      tap(response => {
        if (!response.success) {
          throw new Error('Failed to fetch report preview');
        }
      }),
      catchError(error => {
        console.error('Error fetching report preview:', error);
        return throwError(() => this.getErrorMessage(error));
      })
    );
  }

  /**
   * Generate PDF report
   */
  generateReport(analysisId: string): Observable<ReportGenerationResponse> {
    this.generationStatus$.next({
      status: 'generating',
      message: 'Generating your report...'
    });

    return this.http.post<ReportGenerationResponse>(
      `${this.apiUrl}/reports/generate/${analysisId}`,
      {}
    ).pipe(
      retry(2),
      tap(response => {
        if (response.success) {
          this.generationStatus$.next({
            status: 'success',
            message: 'Report generated successfully!',
            reportUrl: response.data.reportUrl,
            expiresAt: response.data.expiresAt
          });
        }
      }),
      catchError(error => {
        const errorMessage = this.getErrorMessage(error);
        this.generationStatus$.next({
          status: 'error',
          message: 'Failed to generate report',
          error: errorMessage
        });
        return throwError(() => errorMessage);
      }),
      finalize(() => {
        // Reset status after 5 seconds if not idle
        setTimeout(() => {
          const currentStatus = this.generationStatus$.value;
          if (currentStatus.status !== 'idle') {
            this.generationStatus$.next({ status: 'idle' });
          }
        }, 5000);
      })
    );
  }

  /**
   * Regenerate expired download link
   */
  regenerateDownloadLink(analysisId: string): Observable<ReportGenerationResponse> {
    this.generationStatus$.next({
      status: 'generating',
      message: 'Regenerating download link...'
    });

    return this.http.post<ReportGenerationResponse>(
      `${this.apiUrl}/reports/regenerate-link/${analysisId}`,
      {}
    ).pipe(
      retry(2),
      tap(response => {
        if (response.success) {
          this.generationStatus$.next({
            status: 'success',
            message: 'Download link regenerated!',
            reportUrl: response.data.reportUrl,
            expiresAt: response.data.expiresAt
          });
        }
      }),
      catchError(error => {
        const errorMessage = this.getErrorMessage(error);
        this.generationStatus$.next({
          status: 'error',
          message: 'Failed to regenerate link',
          error: errorMessage
        });
        return throwError(() => errorMessage);
      }),
      finalize(() => {
        setTimeout(() => {
          const currentStatus = this.generationStatus$.value;
          if (currentStatus.status !== 'idle') {
            this.generationStatus$.next({ status: 'idle' });
          }
        }, 5000);
      })
    );
  }

  /**
   * Download report (opens in new tab)
   */
  downloadReport(reportUrl: string): void {
    window.open(reportUrl, '_blank');
  }

  /**
   * Check if report link is expired
   */
  isLinkExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  /**
   * Format expiry date for display
   */
  formatExpiryDate(expiresAt: string): string {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffMs < 0) {
      return 'Expired';
    } else if (diffDays > 0) {
      return `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Expires soon';
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error.error?.error?.message) {
      return error.error.error.message;
    }

    if (error.status === 0) {
      return 'Network error. Please check your connection.';
    }

    if (error.status === 401) {
      return 'Authentication required. Please log in.';
    }

    if (error.status === 403) {
      return 'You do not have permission to access this report.';
    }

    if (error.status === 404) {
      return 'Report not found. Please generate a new report.';
    }

    if (error.status === 429) {
      return 'Too many requests. Please try again later.';
    }

    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }

    return 'An unexpected error occurred. Please try again.';
  }
}
