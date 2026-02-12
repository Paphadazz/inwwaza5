import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { Sidebar } from './sidebar/sidebar';
import { NgxSpinnerComponent } from 'ngx-spinner';
import { PassportService } from './_services/passport-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, Sidebar, NgxSpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private _passport = inject(PassportService);
  
  isSidebarCollapsed = signal(false);
  isLoggedIn = computed(() => this._passport.isSignin());

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }
}
