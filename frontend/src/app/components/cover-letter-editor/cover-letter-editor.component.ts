import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AiService } from '../../services/ai.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cover-letter-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './cover-letter-editor.component.html',
  styleUrls: ['./cover-letter-editor.component.scss']
})
export class CoverLetterEditorComponent {
  @Input() resume: any;
  @Input() jobDescription: string = '';

  loading = false;
  coverLetter: string = '';
  isEditing = false;
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

  generateCoverLetter(): void {
    if (!this.isPremium) {
      this.showUpgradePrompt();
      return;
    }

    if (!this.resume || !this.jobDescription) {
      this.snackBar.open('Please provide both resume and job description', 'Close', {
        duration: 3000
      });
      return;
    }

    this.loading = true;
    this.coverLetter = '';

    this.aiService.generateCoverLetter(this.resume, this.jobDescription).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.coverLetter = response.data.coverLetter;
          this.loading = false;
          this.snackBar.open('Cover letter generated successfully!', 'Close', {
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

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  copyToClipboard(): void {
    if (!this.coverLetter) {
      return;
    }

    navigator.clipboard.writeText(this.coverLetter).then(() => {
      this.snackBar.open('Cover letter copied to clipboard!', 'Close', {
        duration: 2000
      });
    });
  }

  downloadAsText(): void {
    if (!this.coverLetter) {
      return;
    }

    const blob = new Blob([this.coverLetter], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cover-letter.txt';
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Cover letter downloaded!', 'Close', {
      duration: 2000
    });
  }

  clearCoverLetter(): void {
    this.coverLetter = '';
    this.isEditing = false;
  }

  private showUpgradePrompt(): void {
    this.snackBar.open('Cover letter generation is a premium feature. Please upgrade your account.', 'Upgrade', {
      duration: 5000
    }).onAction().subscribe(() => {
      window.location.href = '/pricing';
    });
  }

  private handleError(error: any): void {
    let message = 'Failed to generate cover letter. Please try again.';
    
    if (error.message) {
      message = error.message;
    }

    this.snackBar.open(message, 'Close', {
      duration: 5000
    });
  }

  getWordCount(): number {
    if (!this.coverLetter) {
      return 0;
    }
    return this.coverLetter.trim().split(/\s+/).length;
  }

  getCharacterCount(): number {
    return this.coverLetter.length;
  }
}
