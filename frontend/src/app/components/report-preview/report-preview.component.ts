import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ReportService, ReportData } from '../../services/report.service';

@Component({
  selector: 'app-report-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './report-preview.component.html',
  styleUrl: './report-preview.component.scss'
})
export class ReportPreviewComponent implements OnInit {
  @Input() analysisId!: string;
  
  reportData: ReportData | null = null;
  loading = false;
  error: string | null = null;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    if (this.analysisId) {
      this.loadReportPreview();
    }
  }

  loadReportPreview(): void {
    this.loading = true;
    this.error = null;

    this.reportService.getReportPreview(this.analysisId).subscribe({
      next: (response) => {
        this.reportData = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.error = error;
        this.loading = false;
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return 'warn';
      case 'important': return 'accent';
      default: return 'primary';
    }
  }

  retry(): void {
    this.loadReportPreview();
  }
}
