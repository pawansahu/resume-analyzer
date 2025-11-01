import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-score-breakdown',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatIconModule
  ],
  templateUrl: './score-breakdown.component.html',
  styleUrl: './score-breakdown.component.scss'
})
export class ScoreBreakdownComponent {
  @Input() structureScore: number = 0;
  @Input() keywordScore: number = 0;
  @Input() readabilityScore: number = 0;
  @Input() formattingScore: number = 0;
  
  // Accept breakdown object as well
  @Input() set breakdown(value: any) {
    if (value) {
      this.structureScore = value.structure || 0;
      this.keywordScore = value.keywords || 0;
      this.readabilityScore = value.readability || 0;
      this.formattingScore = value.formatting || 0;
    }
  }

  get categories(): ScoreCategory[] {
    return [
      {
        name: 'Structure',
        score: this.structureScore,
        maxScore: 25,
        percentage: (this.structureScore / 25) * 100,
        color: this.getColor(this.structureScore, 25),
        icon: 'account_tree'
      },
      {
        name: 'Keywords',
        score: this.keywordScore,
        maxScore: 30,
        percentage: (this.keywordScore / 30) * 100,
        color: this.getColor(this.keywordScore, 30),
        icon: 'label'
      },
      {
        name: 'Readability',
        score: this.readabilityScore,
        maxScore: 25,
        percentage: (this.readabilityScore / 25) * 100,
        color: this.getColor(this.readabilityScore, 25),
        icon: 'visibility'
      },
      {
        name: 'Formatting',
        score: this.formattingScore,
        maxScore: 20,
        percentage: (this.formattingScore / 20) * 100,
        color: this.getColor(this.formattingScore, 20),
        icon: 'format_align_left'
      }
    ];
  }

  private getColor(score: number, maxScore: number): string {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'primary';
    if (percentage >= 60) return 'accent';
    return 'warn';
  }

  getTooltip(category: ScoreCategory): string {
    const percentage = Math.round(category.percentage);
    if (percentage >= 80) {
      return `${category.name}: Excellent (${percentage}%)`;
    } else if (percentage >= 60) {
      return `${category.name}: Good (${percentage}%)`;
    } else {
      return `${category.name}: Needs improvement (${percentage}%)`;
    }
  }
}
