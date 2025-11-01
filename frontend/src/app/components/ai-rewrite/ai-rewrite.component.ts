import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AiService, RewriteSuggestion } from '../../services/ai.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ai-rewrite',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './ai-rewrite.component.html',
  styleUrls: ['./ai-rewrite.component.scss']
})
export class AiRewriteComponent {
  @Input() bulletPoints: string[] = [];
  @Input() summary: string = '';
  @Input() mode: 'bullets' | 'summary' = 'bullets';

  loading = false;
  rewrites: RewriteSuggestion[] = [];
  summaries: string[] = [];
  selectedSuggestions: Map<string, string> = new Map();
  isPremium = false;

  constructor(
    private aiService: AiService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.checkPremiumStatus();
  }

  checkPremiumStatus(): void {
    const user = this.authService.getCurrentUser();
    this.isPremium = user?.userTier === 'premium' || user?.userTier === 'admin';
  }

  rewriteContent(): void {
    if (!this.isPremium) {
      this.showUpgradePrompt();
      return;
    }

    this.loading = true;
    this.rewrites = [];
    this.summaries = [];

    if (this.mode === 'bullets') {
      this.rewriteBullets();
    } else {
      this.rewriteSummaryText();
    }
  }

  private rewriteBullets(): void {
    this.aiService.rewriteBulletPoints(this.bulletPoints).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rewrites = response.data.rewrites;
          this.loading = false;
          this.snackBar.open('AI suggestions generated successfully!', 'Close', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        this.loading = false;
        this.handleError(error);
      }
    });
  }

  private rewriteSummaryText(): void {
    this.aiService.rewriteSummary(this.summary).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.summaries = response.data.summaries;
          this.loading = false;
          this.snackBar.open('AI suggestions generated successfully!', 'Close', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        this.loading = false;
        this.handleError(error);
      }
    });
  }

  selectSuggestion(original: string, suggestion: string): void {
    this.selectedSuggestions.set(original, suggestion);
    this.snackBar.open('Suggestion selected', 'Close', {
      duration: 2000
    });
  }

  isSelected(original: string, suggestion: string): boolean {
    return this.selectedSuggestions.get(original) === suggestion;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Close', {
        duration: 2000
      });
    });
  }

  getSelectedSuggestions(): Map<string, string> {
    return this.selectedSuggestions;
  }

  private showUpgradePrompt(): void {
    this.snackBar.open('AI rewrite is a premium feature. Please upgrade your account.', 'Upgrade', {
      duration: 5000
    }).onAction().subscribe(() => {
      // Navigate to pricing page
      window.location.href = '/pricing';
    });
  }

  private handleError(error: any): void {
    let message = 'Failed to generate AI suggestions. Please try again.';
    
    if (error.message) {
      message = error.message;
    }

    this.snackBar.open(message, 'Close', {
      duration: 5000
    });
  }

  getDiffClass(original: string, suggestion: string): string {
    // Simple diff highlighting - words that are different
    const originalWords = original.toLowerCase().split(' ');
    const suggestionWords = suggestion.toLowerCase().split(' ');
    
    const hasChanges = originalWords.some((word, idx) => suggestionWords[idx] !== word);
    return hasChanges ? 'has-changes' : '';
  }
}
