import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  loading = false;
  submitted = false;

  categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Report a Bug' },
    { value: 'feedback', label: 'Feedback' }
  ];

  contactInfo = [
    {
      icon: 'email',
      title: 'Email Us',
      value: 'support@resumeanalyzer.com',
      description: 'We\'ll respond within 24 hours'
    },
    {
      icon: 'schedule',
      title: 'Response Time',
      value: '< 24 hours',
      description: 'Average response time'
    },
    {
      icon: 'support_agent',
      title: 'Live Chat',
      value: 'Coming Soon',
      description: 'Real-time support'
    }
  ];

  faqs = [
    {
      question: 'How do I upgrade my plan?',
      answer: 'Go to the Pricing page and select your desired plan. You can upgrade anytime from your dashboard.'
    },
    {
      question: 'Can I get a refund?',
      answer: 'Yes! We offer a 7-day money-back guarantee. Contact us within 7 days of purchase for a full refund.'
    },
    {
      question: 'How accurate is the ATS score?',
      answer: 'Our ATS scoring algorithm is based on industry standards and tested against major ATS systems with 95% accuracy.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support PDF and DOCX formats. Your resume should be under 5MB in size.'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      category: ['general', Validators.required],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.loading = true;

      const apiUrl = environment.apiUrl || 'http://localhost:3000/api';
      
      this.http.post(`${apiUrl}/contact/submit`, this.contactForm.value).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.submitted = true;
          this.snackBar.open('Message sent successfully! We\'ll get back to you soon.', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          this.contactForm.reset();
          this.contactForm.patchValue({ category: 'general' });
        },
        error: (error) => {
          this.loading = false;
          console.error('Contact form error:', error);
          this.snackBar.open('Failed to send message. Please try again or email us directly.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  resetForm(): void {
    this.submitted = false;
    this.contactForm.reset();
    this.contactForm.patchValue({ category: 'general' });
  }
}
