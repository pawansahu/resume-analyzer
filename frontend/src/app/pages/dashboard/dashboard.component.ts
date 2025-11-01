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
import { AuthService } from '../../services/auth.service';
import { ResumeService } from '../../services/resume.service';

@Component({
  selector: 'app-dashboard',
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
    MatSnackBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user = {
    name: 'John Doe',
    email: 'john@example.com',
    tier: 'free',
    usageCount: 2,
    usageLimit: 3
  };

  recentAnalyses: any[] = [];
  loadingAnalyses = true;
  analysesError = false;

  constructor(
    private authService: AuthService,
    private resumeService: ResumeService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Load user data from auth service
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = {
          name: user.firstName || user.email.split('@')[0],
          email: user.email,
          tier: user.userTier,
          usageCount: 0,
          usageLimit: user.userTier === 'premium' ? 999 : 3
        };
        
        // Load fresh usage data from API
        this.loadUsageData();
        
        // Load user's analyses
        this.loadRecentAnalyses();
      }
    });
  }

  loadUsageData(): void {
    this.resumeService.getUserUsage().subscribe({
      next: (response) => {
        if (response.success) {
          this.user.usageCount = response.data.usageCount;
          this.user.usageLimit = response.data.usageLimit;
        }
      },
      error: (error) => {
        console.error('Error loading usage data:', error);
        // Keep default values on error
      }
    });
  }

  loadRecentAnalyses(): void {
    this.loadingAnalyses = true;
    this.analysesError = false;
    
    this.resumeService.getUserAnalyses(5).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentAnalyses = response.data.map((analysis: any) => ({
            ...analysis,
            date: new Date(analysis.date)
          }));
        }
        this.loadingAnalyses = false;
      },
      error: (error) => {
        console.error('Error loading analyses:', error);
        this.analysesError = true;
        this.loadingAnalyses = false;
      }
    });
  }

  viewAnalysisDetails(analysisId: string): void {
    this.router.navigate(['/analysis', analysisId]);
  }

  downloadReport(analysisId: string): void {
    this.resumeService.downloadReport(analysisId).subscribe({
      next: (blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Resume_Analysis_${analysisId}.pdf`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
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
    // Prevent event bubbling
    if (event) {
      event.stopPropagation();
    }

    this.resumeService.generateShareLink(analysisId, 7).subscribe({
      next: (response) => {
        if (response.success) {
          const shareUrl = response.data.shareUrl;
          
          // Copy to clipboard
          navigator.clipboard.writeText(shareUrl).then(() => {
            this.snackBar.open('Share link copied to clipboard!', 'Close', {
              duration: 3000
            });
          }).catch(() => {
            // Fallback: show the URL
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
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
}
