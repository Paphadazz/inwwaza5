import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { DashboardService } from '../_services/dashboard-service';
import { DashboardSummary } from '../_models/dashboard-summary';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private _dashboardService = inject(DashboardService);
  private _router = inject(Router);

  summary = signal<DashboardSummary | null>(null);
  loading = signal<boolean>(true);

  async ngOnInit() {
    try {
      const data = await this._dashboardService.getSummary();
      this.summary.set(data);
      console.log('Dashboard data loaded:', data);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      this.loading.set(false);
    }
  }

  navigateToMissions() {
    this._router.navigate(['/missions']);
  }

  navigateToMyMissions() {
    this._router.navigate(['/my-mission']);
  }
}

