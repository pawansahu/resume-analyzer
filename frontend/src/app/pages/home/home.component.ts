import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  features = [
    {
      icon: 'assessment',
      title: 'ATS Score',
      description: 'Get instant ATS compatibility score for your resume'
    },
    {
      icon: 'search',
      title: 'Keyword Match',
      description: 'Match your resume against job descriptions'
    },
    {
      icon: 'auto_fix_high',
      title: 'AI Rewrite',
      description: 'AI-powered suggestions to improve your resume'
    },
    {
      icon: 'description',
      title: 'Cover Letter',
      description: 'Generate tailored cover letters instantly'
    }
  ];
}
