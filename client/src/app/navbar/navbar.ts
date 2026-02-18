import { Component, computed, inject, signal, Signal, Output, EventEmitter } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { PassportService } from '../_services/passport-service';
import { ThemeService } from '../_services/theme-service';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    RouterLink,
    RouterLinkActive,
    MatMenuModule,
    MatIconModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private _passport = inject(PassportService);
  private _router = inject(Router);
  themeService = inject(ThemeService);

  @Output() toggleSidebar = new EventEmitter<void>();

  display_name: Signal<string | undefined>;
  avatar_url: Signal<string | undefined>;

  constructor() {
    this.display_name = computed(() => {
      const p = this._passport.data();
      return p?.display_name || (p?.token ? 'User' : undefined);
    });
    this.avatar_url = computed(
      () => this._passport.data()?.avatar_url || '/assets/default-avatar.jpg',
    );
  }

  logout() {
    this._passport.destroy();
    this._router.navigate(['/login']);
  }
}
