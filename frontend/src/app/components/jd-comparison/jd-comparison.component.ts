import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ResumeService } from '../../services/resume.service';

interface MatchResult {
  matchPercentage: number;
  matchedKeywords: Array<{
    word: string;
    resumeFrequency: number;
    jdFrequency: number;
    importance: number;
  }>;
  missingKeywords: Array<{
    word: string;
    frequency: number;
    importance: number;
  }>;
  suggestions: Array<{
    priority: string;
    category: string;
    message: string;
    action: string;
  }>;
  jdRequirements: {
    totalKeywords: number;
    skills: string[];
    experience: any;
  };
}

@Component({
  selector: 'app-jd-comparison',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './jd-comparison.component.html',
  styleUrls: ['./jd-comparison.component.scss']
})
export class JdComparisonComponent implements OnInit {
  @Input() analysisId: string = '';

  jobDescription: string = '';
  maxLength: number = 10000;
  isAnalyzing: boolean = false;
  matchResult: MatchResult | null = null;
  error: string = '';

  constructor(private resumeService: ResumeService) {}

  ngOnInit(): void {}

  get characterCount(): number {
    return this.jobDescription.length;
  }

  get isOverLimit(): boolean {
    return this.characterCount > this.maxLength;
  }

  get matchColor(): string {
    if (!this.matchResult) return '';
    
    const percentage = this.matchResult.matchPercentage;
    if (percentage >= 85) return 'success';
    if (percentage >= 70) return 'warning';
    return 'danger';
  }

  analyzeMatch(): void {
    if (!this.jobDescription.trim() || this.isOverLimit) {
      this.error = 'Please enter a valid job description';
      return;
    }

    this.isAnalyzing = true;
    this.error = '';
    this.matchResult = null;

    this.resumeService.matchJobDescription(this.analysisId, this.jobDescription)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.matchResult = response.data;
          }
          this.isAnalyzing = false;
        },
        error: (error) => {
          this.error = this.getErrorMessage(error);
          this.isAnalyzing = false;
        }
      });
  }

  clearAnalysis(): void {
    this.jobDescription = '';
    this.matchResult = null;
    this.error = '';
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical':
        return 'danger';
      case 'important':
        return 'warning';
      case 'suggested':
        return 'info';
      default:
        return '';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'important':
        return 'warning';
      case 'suggested':
        return 'info';
      default:
        return 'help';
    }
  }

  private getErrorMessage(error: any): string {
    if (error.error?.error?.message) {
      return error.error.error.message;
    }
    return 'Failed to analyze job description. Please try again.';
  }
}
