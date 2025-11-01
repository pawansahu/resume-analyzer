import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatDividerModule
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

  recentAnalyses = [
    {
      id: 1,
      fileName: 'Resume_2024.pdf',
      atsScore: 78,
      date: new Date('2024-01-15')
    },
    {
      id: 2,
      fileName: 'My_Resume.docx',
      atsScore: 65,
      date: new Date('2024-01-10')
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load user data from auth service
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = {
          name: user.firstName || user.email.split('@')[0],
          email: user.email,
          tier: user.userTier,
          usageCount: user.usageCount || 0,
          usageLimit: user.userTier === 'premium' ? 999 : 3
        };
      }
    });
  }

  viewAnalysisDetails(analysisId: number): void {
    // TODO: Navigate to analysis details page
    console.log('View analysis details:', analysisId);
    // For now, redirect to upload page
    this.router.navigate(['/upload']);
  }

  downloadReport(analysisId: number): void {
    // TODO: Implement report download
    console.log('Download report:', analysisId);
    // In production, this would call the report service
    alert('Report download feature coming soon!');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
