import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ats-score-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './ats-score-card.component.html',
  styleUrl: './ats-score-card.component.scss'
})
export class AtsScoreCardComponent {
  @Input() score: number = 0;
  @Input() loading: boolean = false;

  get scoreColor(): string {
    if (this.score >= 80) return '#4caf50'; // Green
    if (this.score >= 60) return '#ff9800'; // Orange
    return '#f44336'; // Red
  }

  get scoreLabel(): string {
    if (this.score >= 80) return 'Excellent';
    if (this.score >= 60) return 'Good';
    if (this.score >= 40) return 'Fair';
    return 'Needs Improvement';
  }

  get scoreIcon(): string {
    if (this.score >= 80) return 'check_circle';
    if (this.score >= 60) return 'warning';
    return 'error';
  }

  get progressValue(): number {
    return this.score;
  }
}
