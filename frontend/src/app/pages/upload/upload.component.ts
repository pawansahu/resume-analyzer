import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { ResumeService, UploadProgress, ParsedResume } from '../../services/resume.service';
import { AtsScoreCardComponent } from '../../components/ats-score-card/ats-score-card.component';
import { ScoreBreakdownComponent } from '../../components/score-breakdown/score-breakdown.component';
import { RecommendationsListComponent } from '../../components/recommendations-list/recommendations-list.component';
import { JdComparisonComponent } from '../../components/jd-comparison/jd-comparison.component';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    AtsScoreCardComponent,
    ScoreBreakdownComponent,
    RecommendationsListComponent,
    JdComparisonComponent
  ],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {
  selectedFile: File | null = null;
  isDragging = false;
  uploadProgress: UploadProgress | null = null;
  parsedResume: ParsedResume | null = null;
  analysisId: string | null = null;
  atsScore: any = null;
  recommendations: any[] = [];
  
  // Usage tracking
  usageCount = 0;
  usageLimit = 3;
  usageLimitReached = false;

  constructor(
    private resumeService: ResumeService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsageInfo();
  }

  loadUsageInfo(): void {
    this.resumeService.getUserUsage().subscribe({
      next: (response) => {
        if (response.success) {
          this.usageCount = response.data.usageCount;
          this.usageLimit = response.data.usageLimit;
          this.usageLimitReached = this.usageCount >= this.usageLimit;
          
          // Show warning if limit reached
          if (this.usageLimitReached) {
            this.showLimitReachedWarning();
          }
        }
      },
      error: (error) => {
        console.error('Error loading usage info:', error);
        // Don't show error to user, just use defaults
      }
    });
  }

  handleUsageLimitError(errorData: any): void {
    this.uploadProgress = {
      progress: 0,
      status: 'error',
      message: 'Daily usage limit exceeded'
    };
    
    // Update usage info
    if (errorData.usageCount !== undefined) {
      this.usageCount = errorData.usageCount;
      this.usageLimit = errorData.usageLimit;
      this.usageLimitReached = true;
    }
    
    // Show detailed error with upgrade option
    const message = `Daily limit reached! You've used ${this.usageCount}/${this.usageLimit} analyses today. Upgrade to Premium for unlimited uploads.`;
    
    const snackBarRef = this.snackBar.open(message, 'Upgrade Now', {
      duration: 10000,
      panelClass: ['error-snackbar']
    });
    
    snackBarRef.onAction().subscribe(() => {
      this.router.navigate(['/pricing']);
    });
  }

  showLimitReachedWarning(): void {
    const snackBarRef = this.snackBar.open(
      `You've reached your daily limit (${this.usageCount}/${this.usageLimit}). Upgrade for unlimited analyses!`,
      'Upgrade',
      {
        duration: 8000,
        panelClass: ['warning-snackbar']
      }
    );
    
    snackBarRef.onAction().subscribe(() => {
      this.router.navigate(['/pricing']);
    });
  }

  /**
   * Handle file selection from input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  /**
   * Handle file drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  /**
   * Handle file validation and selection
   */
  private handleFile(file: File): void {
    // Validate file
    const validation = this.resumeService.validateFile(file);
    
    if (!validation.valid) {
      this.snackBar.open(validation.error || 'Invalid file', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.selectedFile = file;
    this.uploadProgress = null;
    this.parsedResume = null;
    this.analysisId = null;
  }

  /**
   * Upload selected file
   */
  uploadFile(): void {
    if (!this.selectedFile) {
      return;
    }

    this.uploadProgress = {
      progress: 0,
      status: 'uploading',
      message: 'Starting upload...'
    };

    this.resumeService.uploadResume(this.selectedFile).subscribe({
      next: (progress: UploadProgress) => {
        this.uploadProgress = progress;
        
        if (progress.status === 'complete' && progress.data) {
          this.analysisId = progress.data.analysisId;
          this.parsedResume = progress.data.parsedResume;
          this.atsScore = progress.data.atsScore;
          this.recommendations = progress.data.recommendations;
          
          // Update usage info if provided
          if (progress.data.usageInfo) {
            this.usageCount = progress.data.usageInfo.usageCount;
            this.usageLimit = progress.data.usageInfo.usageLimit;
            this.usageLimitReached = this.usageCount >= this.usageLimit;
          }
          
          // Debug logging
          console.log('📊 ATS Score received:', this.atsScore);
          console.log('📊 ATS Score type:', typeof this.atsScore);
          console.log('📊 ATS Score keys:', this.atsScore ? Object.keys(this.atsScore) : 'null');
          
          this.snackBar.open('Resume uploaded successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        
        // Check if it's a usage limit error (403)
        if (error.status === 403 && error.error?.error?.code === 'USAGE_LIMIT_EXCEEDED') {
          this.handleUsageLimitError(error.error.error);
        } else {
          this.uploadProgress = {
            progress: 0,
            status: 'error',
            message: error.message || 'Upload failed'
          };
          
          this.snackBar.open(
            this.uploadProgress.message || 'Upload failed',
            'Close',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
        }
      }
    });
  }

  /**
   * Remove selected file
   */
  removeFile(): void {
    this.selectedFile = null;
    this.uploadProgress = null;
    this.parsedResume = null;
    this.analysisId = null;
  }

  /**
   * Retry upload
   */
  retryUpload(): void {
    if (this.selectedFile) {
      this.uploadFile();
    }
  }

  /**
   * Get file size in human-readable format
   */
  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(): string {
    if (!this.selectedFile) return 'description';
    
    const extension = this.selectedFile.name.toLowerCase().split('.').pop();
    
    if (extension === 'pdf') {
      return 'picture_as_pdf';
    } else if (extension === 'docx') {
      return 'description';
    }
    
    return 'insert_drive_file';
  }

  /**
   * Get file type for display
   */
  getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'docx':
        return 'Word Document';
      default:
        return 'Document';
    }
  }

  /**
   * Get progress title based on status
   */
  getProgressTitle(): string {
    if (!this.uploadProgress) return '';
    
    switch (this.uploadProgress.status) {
      case 'uploading':
        return 'Analyzing Resume...';
      case 'complete':
        return 'Analysis Complete!';
      case 'error':
        return 'Analysis Failed';
      default:
        return '';
    }
  }

  /**
   * Navigate to analysis results
   */
  viewResults(): void {
    if (this.analysisId) {
      // For now, navigate to dashboard
      // TODO: Create dedicated analysis results page
      this.router.navigate(['/dashboard']);
    }
  }
}
