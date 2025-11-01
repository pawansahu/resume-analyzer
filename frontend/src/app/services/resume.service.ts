import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, retry, retryWhen, mergeMap, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ParsedResume {
  text: string;
  sections: {
    contact: {
      email?: string;
      phone?: string;
      linkedin?: string;
      github?: string;
      website?: string;
      location?: string;
    };
    summary: string;
    experience: Array<{
      title: string;
      description: string[];
    }>;
    education: Array<{
      degree: string;
      details: string[];
    }>;
    skills: string[];
  };
  metadata: {
    fileType: string;
    parsedAt: string;
    textLength: number;
    wordCount: number;
  };
}

export interface UploadResponse {
  success: boolean;
  data: {
    analysisId: string;
    s3Key: string;
    parsedResume: ParsedResume;
    message: string;
  };
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  constructor(private http: HttpClient) {}

  /**
   * Upload resume file with progress tracking and retry logic
   */
  uploadResume(file: File): Observable<UploadProgress> {
    return new Observable(observer => {
      const formData = new FormData();
      formData.append('resume', file);

      this.http.post<UploadResponse>(`${this.apiUrl}/resume/upload`, formData, {
        reportProgress: true,
        observe: 'events'
      }).pipe(
        retryWhen(errors =>
          errors.pipe(
            mergeMap((error, index) => {
              if (index >= this.maxRetries) {
                return throwError(() => error);
              }
              
              // Retry on network errors or 5xx errors
              if (error.status === 0 || error.status >= 500) {
                observer.next({
                  progress: 0,
                  status: 'uploading',
                  message: `Retrying upload (${index + 1}/${this.maxRetries})...`
                });
                return timer(this.retryDelay * (index + 1));
              }
              
              return throwError(() => error);
            })
          )
        ),
        catchError(error => {
          observer.next({
            progress: 0,
            status: 'error',
            message: this.getErrorMessage(error)
          });
          return throwError(() => error);
        })
      ).subscribe({
        next: (event: HttpEvent<UploadResponse>) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = event.total 
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
            
            observer.next({
              progress,
              status: 'uploading',
              message: `Uploading... ${progress}%`
            });
          } else if (event.type === HttpEventType.Response) {
            if (event.body?.success) {
              observer.next({
                progress: 100,
                status: 'complete',
                message: 'Resume uploaded and parsed successfully!',
                data: event.body.data
              });
              observer.complete();
            } else {
              observer.next({
                progress: 0,
                status: 'error',
                message: 'Upload failed'
              });
              observer.error(new Error('Upload failed'));
            }
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Get analysis result by ID
   */
  getAnalysisResult(analysisId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/resume/analysis/${analysisId}`).pipe(
      catchError(error => {
        console.error('Error fetching analysis:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Match resume with job description
   */
  matchJobDescription(analysisId: string, jobDescription: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resume/match-jd`, {
      analysisId,
      jobDescription
    }).pipe(
      retry(2),
      catchError(error => {
        console.error('Error matching job description:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.docx'];
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: 'Invalid file type. Only PDF and DOCX files are allowed.'
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit.'
      };
    }

    return { valid: true };
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error.error?.error?.message) {
      return error.error.error.message;
    }
    
    if (error.status === 0) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (error.status === 400) {
      return 'Invalid file. Please check the file type and size.';
    }
    
    if (error.status === 401) {
      return 'Authentication required. Please log in.';
    }
    
    if (error.status === 403) {
      return 'You have reached your upload limit. Please upgrade your plan.';
    }
    
    if (error.status === 413) {
      return 'File is too large. Maximum size is 5MB.';
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
