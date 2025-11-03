import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  currentRoute = '';
  isLoggedIn = false;

  // Public navigation links (visible to all users)
  publicNavLinks = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/pricing', label: 'Pricing', icon: 'payments' },
    { path: '/contact', label: 'Contact', icon: 'contact_mail' }
  ];

  // Authenticated navigation links (visible only to logged-in users)
  authNavLinks = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/pricing', label: 'Pricing', icon: 'payments' },
    { path: '/contact', label: 'Contact', icon: 'contact_mail' }
  ];

  // Get current navigation links based on auth status
  get navLinks() {
    return this.isLoggedIn ? this.authNavLinks : this.publicNavLinks;
  }

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Check auth status first
    this.checkAuthStatus();

    // Track current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        // Recheck auth status on route change
        this.checkAuthStatus();
      });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  isActive(path: string): boolean {
    return this.currentRoute === path || this.currentRoute.startsWith(path + '/');
  }

  checkAuthStatus(): void {
    // Check for authentication token (using the same key as AuthService)
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('currentUser');
    this.isLoggedIn = !!(token && user);
  }

  logout(): void {
    // Clear all auth data (using the same keys as AuthService)
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.isLoggedIn = false;
    this.closeMenu();
    this.router.navigate(['/login']);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.closeMenu();
  }
}
