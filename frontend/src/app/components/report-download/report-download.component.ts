import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReportService, ReportGenerationStatus } from '../../services/report.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-report-download',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './report-download.component.html',
  styleUrl: './report-download.component.scss'
})
export class ReportDownloadComponent implements OnInit, OnDestroy {
  @Input() analysisId!: string;
  @Input() existingReportUrl?: string;
  @Input() existingExpiresAt?: string;

  generationStatus: ReportGenerationStatus = { status: 'idle' };
  reportUrl: string | null = null;
  expiresAt: string | null = null;
  retryCount = 0;
  maxRetries = 3;

  private statusSubscription?: Subscription;

  constructor(
    private reportService: ReportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Subscribe to generation status
    this.statusSubscription = this.reportService.getGenerationStatus().subscribe(
      status => {
        this.generationStatus = status;
        
        if (status.status === 'success') {
          this.reportUrl = status.reportUrl || null;
          this.expiresAt = status.expiresAt || null;
          this.retryCount = 0;
          this.showSuccessMessage('Report generated successfully!');
        } else if (status.status === 'error') {
          this.showErrorMessage(status.error || 'Failed to generate report');
        }
      }
    );

    // Set existing report data if available
    if (this.existingReportUrl && this.existingExpiresAt) {
      this.reportUrl = this.existingReportUrl;
      this.expiresAt = this.existingExpiresAt;
    }
  }

  ngOnDestroy(): void {
    this.statusSubscription?.unsubscribe();
  }

  generateReport(): void {
    if (!this.analysisId) {
      this.showErrorMessage('Analysis ID is required');
      return;
    }

    this.reportService.generateReport(this.analysisId).subscribe({
      next: (response) => {
        if (response.success) {
          this.reportUrl = response.data.reportUrl;
          this.expiresAt = response.data.expiresAt;
        }
      },
      error: (error) => {
        console.error('Error generating report:', error);
        
        // Retry logic
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          this.showErrorMessage(`Generation failed. Retrying (${this.retryCount}/${this.maxRetries})...`);
          setTimeout(() => this.generateReport(), 2000 * this.retryCount);
        } else {
          this.showErrorMessage('Failed to generate report after multiple attempts');
          this.retryCount = 0;
        }
      }
    });
  }

  downloadReport(): void {
    if (this.reportUrl) {
      if (this.isExpired()) {
        this.regenerateLink();
      } else {
        this.reportService.downloadReport(this.reportUrl);
        this.showSuccessMessage('Opening report in new tab...');
      }
    }
  }

  regenerateLink(): void {
    if (!this.analysisId) {
      this.showErrorMessage('Analysis ID is required');
      return;
    }

    this.reportService.regenerateDownloadLink(this.analysisId).subscribe({
      next: (response) => {
        if (response.success) {
          this.reportUrl = response.data.reportUrl;
          this.expiresAt = response.data.expiresAt;
          this.showSuccessMessage('Download link regenerated!');
        }
      },
      error: (error) => {
        console.error('Error regenerating link:', error);
        this.showErrorMessage('Failed to regenerate download link');
      }
    });
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return this.reportService.isLinkExpired(this.expiresAt);
  }

  getExpiryText(): string {
    if (!this.expiresAt) return '';
    return this.reportService.formatExpiryDate(this.expiresAt);
  }

  isGenerating(): boolean {
    return this.generationStatus.status === 'generating';
  }

  hasReport(): boolean {
    return !!this.reportUrl;
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }
}
