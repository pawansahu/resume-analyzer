import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface RewriteSuggestion {
  original: string;
  suggestions: string[];
}

export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = `${environment.apiUrl}/ai`;
  private requestTimeout = 35000; // 35 seconds (slightly more than backend timeout)

  constructor(private http: HttpClient) {}

  /**
   * Rewrite bullet points with AI suggestions
   */
  rewriteBulletPoints(bulletPoints: string[]): Observable<AIResponse<{ rewrites: RewriteSuggestion[] }>> {
    return this.http.post<AIResponse<{ rewrites: RewriteSuggestion[] }>>(
      `${this.apiUrl}/rewrite/bullet-points`,
      { bulletPoints }
    ).pipe(
      timeout(this.requestTimeout),
      catchError(this.handleError)
    );
  }

  /**
   * Rewrite summary with AI suggestions
   */
  rewriteSummary(summary: string): Observable<AIResponse<{ summaries: string[] }>> {
    return this.http.post<AIResponse<{ summaries: string[] }>>(
      `${this.apiUrl}/rewrite/summary`,
      { summary }
    ).pipe(
      timeout(this.requestTimeout),
      catchError(this.handleError)
    );
  }

  /**
   * Generate cover letter based on resume and job description
   */
  generateCoverLetter(resume: any, jobDescription: string): Observable<AIResponse<{ coverLetter: string }>> {
    return this.http.post<AIResponse<{ coverLetter: string }>>(
      `${this.apiUrl}/cover-letter`,
      { resume, jobDescription }
    ).pipe(
      timeout(this.requestTimeout),
      catchError(this.handleError)
    );
  }

  /**
   * Improve a specific resume section
   */
  improveSection(sectionText: string, sectionType: string): Observable<AIResponse<{ improvements: string[] }>> {
    return this.http.post<AIResponse<{ improvements: string[] }>>(
      `${this.apiUrl}/improve/section`,
      { sectionText, sectionType }
    ).pipe(
      timeout(this.requestTimeout),
      catchError(this.handleError)
    );
  }

  /**
   * Check AI service health
   */
  healthCheck(): Observable<AIResponse<{ status: string; provider: string }>> {
    return this.http.get<AIResponse<{ status: string; provider: string }>>(
      `${this.apiUrl}/health`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.name === 'TimeoutError') {
      errorMessage = 'Request timed out. The AI service is taking longer than expected. Please try again.';
    } else if (error.error?.error?.message) {
      errorMessage = error.error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
