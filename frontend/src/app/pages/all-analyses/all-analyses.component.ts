import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ResumeService } from '../../services/resume.service';

@Component({
  selector: 'app-all-analyses',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule
  ],
  templateUrl: './all-analyses.component.html',
  styleUrls: ['./all-analyses.component.scss']
})
export class AllAnalysesComponent implements OnInit {
  analyses: any[] = [];
  loading = true;
  error = false;
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalAnalyses = 0;

  constructor(
    private resumeService: ResumeService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAnalyses();
  }

  loadAnalyses(): void {
    this.loading = true;
    this.error = false;
    
    // Load all analyses (or implement pagination on backend)
    this.resumeService.getUserAnalyses(100).subscribe({
      next: (response) => {
        if (response.success) {
          this.analyses = response.data.map((analysis: any) => ({
            ...analysis,
            date: new Date(analysis.date)
          }));
          this.totalAnalyses = this.analyses.length;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analyses:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  getPaginatedAnalyses(): any[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.analyses.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  viewAnalysisDetails(analysisId: string): void {
    this.router.navigate(['/analysis', analysisId]);
  }

  downloadReport(analysisId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.resumeService.downloadReport(analysisId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Resume_Analysis_${analysisId}.pdf`;
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('Report downloaded successfully!', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Download error:', error);
        this.snackBar.open('Failed to download report', 'Close', {
          duration: 5000
        });
      }
    });
  }

  shareAnalysis(analysisId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.resumeService.generateShareLink(analysisId, 7).subscribe({
      next: (response) => {
        if (response.success) {
          const shareUrl = response.data.shareUrl;
          
          navigator.clipboard.writeText(shareUrl).then(() => {
            this.snackBar.open('Share link copied to clipboard!', 'Close', {
              duration: 3000
            });
          }).catch(() => {
            this.snackBar.open(`Share URL: ${shareUrl}`, 'Close', {
              duration: 10000
            });
          });
        }
      },
      error: (error) => {
        console.error('Share error:', error);
        this.snackBar.open('Failed to generate share link', 'Close', {
          duration: 5000
        });
      }
    });
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'docx':
      case 'doc':
        return 'description';
      default:
        return 'insert_drive_file';
    }
  }

  getStrokeDashoffset(score: number): number {
    const circumference = 339.292;
    return circumference - (circumference * score / 100);
  }

  getScoreStatus(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Work';
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
