import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ResumeService } from '../../services/resume.service';
import { AuthService } from '../../services/auth.service';
import { AtsScoreCardComponent } from '../../components/ats-score-card/ats-score-card.component';
import { ScoreBreakdownComponent } from '../../components/score-breakdown/score-breakdown.component';
import { RecommendationsListComponent } from '../../components/recommendations-list/recommendations-list.component';

@Component({
  selector: 'app-shared-analysis',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    AtsScoreCardComponent,
    ScoreBreakdownComponent,
    RecommendationsListComponent
  ],
  templateUrl: './shared-analysis.component.html',
  styleUrls: ['./shared-analysis.component.scss']
})
export class SharedAnalysisComponent implements OnInit {
  shareToken: string | null = null;
  loading = true;
  error = false;
  errorMessage = '';
  
  analysisData: any = null;
  atsScore: any = null;
  recommendations: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private resumeService: ResumeService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.shareToken = this.route.snapshot.paramMap.get('token');
    
    if (this.shareToken) {
      this.loadSharedAnalysis();
    } else {
      this.error = true;
      this.errorMessage = 'Invalid share link';
      this.loading = false;
    }
  }

  loadSharedAnalysis(): void {
    if (!this.shareToken) return;
    
    this.loading = true;
    this.error = false;
    
    this.resumeService.getSharedAnalysis(this.shareToken).subscribe({
      next: (response) => {
        if (response.success) {
          this.analysisData = response.data;
          this.atsScore = response.data.atsScore;
          this.recommendations = response.data.recommendations || [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading shared analysis:', error);
        this.error = true;
        this.loading = false;
        
        if (error.status === 404) {
          this.errorMessage = 'This shared analysis was not found or may have been removed.';
        } else if (error.status === 410) {
          this.errorMessage = 'This share link has expired.';
        } else {
          this.errorMessage = 'Failed to load the shared analysis.';
        }
      }
    });
  }

  goToUpload(): void {
    // Check if user is logged in
    const isLoggedIn = this.authService.isAuthenticated();
    
    if (isLoggedIn) {
      // User is logged in, go to upload page
      this.router.navigate(['/upload']);
    } else {
      // User is not logged in, redirect to login with return URL
      this.snackBar.open('Please login to analyze your resume', 'Close', {
        duration: 3000
      });
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/upload' }
      });
    }
  }

  goToRegister(): void {
    this.router.navigate(['/register'], {
      queryParams: { returnUrl: '/upload' }
    });
  }
}
