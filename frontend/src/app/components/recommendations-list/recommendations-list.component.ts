import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

interface Recommendation {
  category: string;
  priority: 'critical' | 'important' | 'suggested';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionItems: string[];
}

@Component({
  selector: 'app-recommendations-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule
  ],
  templateUrl: './recommendations-list.component.html',
  styleUrl: './recommendations-list.component.scss'
})
export class RecommendationsListComponent {
  @Input() recommendations: Recommendation[] = [];
  @Input() totalScore: number = 0;

  get criticalRecommendations(): Recommendation[] {
    return this.recommendations.filter(r => r.priority === 'critical');
  }

  get importantRecommendations(): Recommendation[] {
    return this.recommendations.filter(r => r.priority === 'important');
  }

  get suggestedRecommendations(): Recommendation[] {
    return this.recommendations.filter(r => r.priority === 'suggested');
  }

  get hasCriticalIssues(): boolean {
    return this.totalScore < 60 || this.criticalRecommendations.length > 0;
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical': return 'error';
      case 'important': return 'warning';
      case 'suggested': return 'info';
      default: return 'info';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return 'critical';
      case 'important': return 'important';
      case 'suggested': return 'suggested';
      default: return 'suggested';
    }
  }

  getImpactLabel(impact: string): string {
    return impact.charAt(0).toUpperCase() + impact.slice(1) + ' Impact';
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'structure': return 'account_tree';
      case 'keywords': return 'label';
      case 'readability': return 'visibility';
      case 'formatting': return 'format_align_left';
      default: return 'help';
    }
  }
}
