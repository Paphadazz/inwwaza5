import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { DashboardService } from '../_services/dashboard-service';
import { DashboardSummary, ActivityPoint } from '../_models/dashboard-summary';

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

  // SVG Chart Dimensions
  chartWidth = 1000;
  chartHeight = 300;
  padding = 40;

  // Month Labels
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  async ngOnInit() {
    try {
      const data = await this._dashboardService.getSummary();
      this.summary.set(data);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      this.loading.set(false);
    }
  }

  getMaxValue(): number {
    const data = this.summary()?.chart_data || [];
    if (data.length === 0) return 10;
    const maxVal = Math.max(...data.map(p => Math.max(p.active, p.created, p.joined, p.completed, 5)));
    // Return next multiple of 5 + 5 buffer
    return Math.ceil((maxVal + 5) / 5) * 5;
  }

  getYLabels(): number[] {
    const max = this.getMaxValue();
    const labels = [];
    for (let i = 0; i <= max; i += 5) {
      labels.push(i);
    }
    return labels.reverse();
  }

  getCoordinates(index: number, value: number, type?: string): { x: number, y: number } {
    const data = this.summary()?.chart_data || [];
    const count = data.length || 12;
    const x = (index / (count - 1)) * (this.chartWidth - 2 * this.padding) + this.padding;

    // Add small vertical offsets for different types when value is 0 to distinguish lines
    let offset = 0;
    if (value === 0) {
      if (type === 'created') offset = -3;
      if (type === 'completed') offset = 3;
      if (type === 'active') offset = -1.5;
    }

    const y = this.chartHeight - ((value / this.getMaxValue()) * (this.chartHeight - 2 * this.padding) + this.padding) + offset;
    return { x, y };
  }

  getSmoothPath(type: 'created' | 'joined' | 'completed' | 'active'): string {
    const data = this.summary()?.chart_data || [];
    if (data.length === 0) return '';

    const points = data.map((p, i) => {
      const val = (p as any)[type] || 0;
      return this.getCoordinates(i, val, type);
    });

    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];

      // Control points for smooth curve
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    return path;
  }

  navigateToMissions() {
    this._router.navigate(['/missions']);
  }

  navigateToMyMissions() {
    this._router.navigate(['/missions'], { queryParams: { filter: 'mine' } });
  }
}
