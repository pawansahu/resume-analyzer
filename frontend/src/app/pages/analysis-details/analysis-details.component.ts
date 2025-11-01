import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ResumeService } from '../../services/resume.service';
import { AtsScoreCardComponent } from '../../components/ats-score-card/ats-score-card.component';
import { ScoreBreakdownComponent } from '../../components/score-breakdown/score-breakdown.component';
import { RecommendationsListComponent } from '../../components/recommendations-list/recommendations-list.component';

@Component({
  selector: 'app-analysis-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    AtsScoreCardComponent,
    ScoreBreakdownComponent,
    RecommendationsListComponent
  ],
  templateUrl: './analysis-details.component.html',
  styleUrls: ['./analysis-details.component.scss']
})
export class AnalysisDetailsComponent implements OnInit {
  analysisId: string | null = null;
  loading = true;
  error = false;
  
  analysisData: any = null;
  atsScore: any = null;
  parsedResume: any = null;
  recommendations: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private resumeService: ResumeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.analysisId = this.route.snapshot.paramMap.get('id');
    
    if (this.analysisId) {
      this.loadAnalysisDetails();
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  loadAnalysisDetails(): void {
    if (!this.analysisId) return;
    
    this.loading = true;
    this.error = false;
    
    this.resumeService.getAnalysisResult(this.analysisId).subscribe({
      next: (response) => {
        if (response.success) {
          this.analysisData = response.data;
          this.atsScore = response.data.atsScore;
          this.parsedResume = response.data.parsedData;
          this.recommendations = response.data.recommendations || [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analysis:', error);
        this.error = true;
        this.loading = false;
        this.snackBar.open('Failed to load analysis details', 'Close', {
          duration: 5000
        });
      }
    });
  }

  downloading = false;
  sharing = false;
  shareUrl = '';

  shareAnalysis(): void {
    if (!this.analysisId || this.sharing) return;
    
    this.sharing = true;
    
    this.resumeService.generateShareLink(this.analysisId, 7).subscribe({
      next: (response) => {
        if (response.success) {
          this.shareUrl = response.data.shareUrl;
          this.copyShareLink();
        }
        this.sharing = false;
      },
      error: (error) => {
        console.error('Share error:', error);
        this.sharing = false;
        this.snackBar.open('Failed to generate share link', 'Close', {
          duration: 5000
        });
      }
    });
  }

  copyShareLink(): void {
    navigator.clipboard.writeText(this.shareUrl).then(() => {
      this.snackBar.open('Share link copied to clipboard!', 'Close', {
        duration: 3000
      });
    }).catch(() => {
      this.snackBar.open(`Share URL: ${this.shareUrl}`, 'Close', {
        duration: 10000
      });
    });
  }

  downloadReport(): void {
    if (!this.analysisId || this.downloading) return;
    
    this.downloading = true;
    this.snackBar.open('Generating PDF report...', '', {
      duration: 2000
    });
    
    this.resumeService.downloadReport(this.analysisId).subscribe({
      next: (blob) => {
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Resume_Analysis_${this.analysisId}.pdf`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.downloading = false;
        this.snackBar.open('Report downloaded successfully!', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Download error:', error);
        this.downloading = false;
        this.snackBar.open('Failed to download report. Please try again.', 'Close', {
          duration: 5000
        });
      }
    });
  }

  reAnalyze(): void {
    this.router.navigate(['/upload']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getContactInfo(): string[] {
    const contact = this.parsedResume?.sections?.contact || {};
    const info: string[] = [];
    
    if (contact.email) info.push(contact.email);
    if (contact.phone) info.push(contact.phone);
    if (contact.location) info.push(contact.location);
    
    return info;
  }

  getSocialLinks(): any[] {
    const contact = this.parsedResume?.sections?.contact || {};
    const links: any[] = [];
    
    if (contact.linkedin) {
      links.push({ icon: 'link', label: 'LinkedIn', url: contact.linkedin });
    }
    if (contact.github) {
      links.push({ icon: 'code', label: 'GitHub', url: contact.github });
    }
    if (contact.website) {
      links.push({ icon: 'language', label: 'Website', url: contact.website });
    }
    
    return links;
  }

  getSectionCount(): number {
    if (!this.parsedResume?.sections) return 0;
    return Object.keys(this.parsedResume.sections).length;
  }
}
