import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PassportService } from '../_services/passport-service';
import { MissionService } from '../_services/mission-service';
import { Mission } from '../_models/mission';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  private router = inject(Router);
  private passportService = inject(PassportService);
  private missionService = inject(MissionService);

  // User Signal
  user = this.passportService.data;

  // Mission Signals
  activeMissions = signal<Mission[]>([]);
  featuredMissions = signal<Mission[]>([]);
  isLoading = signal(true);

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.isLoading.set(true);
    try {
      // Fetch Active Missions (joined by user)
      const myMissions = await this.missionService.getMyMissions();
      this.activeMissions.set(myMissions.slice(0, 5));

      // Fetch Featured/Open Missions
      const allOpen = await this.missionService.getByFilter({ status: 'Open' });
      // Filter out those already joined if possible, or just take first 4
      this.featuredMissions.set(allOpen.filter(m => !m.is_joined).slice(0, 4));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onViewMission(id: number) {
    this.router.navigate(['/missions']); // Or a specific mission detail path if it exists
  }

  async onJoinMission(id: number) {
    try {
      await this.missionService.join(id);
      await this.loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error joining mission:', error);
    }
  }

  onBrowseAll() {
    this.router.navigate(['/missions']);
  }

  onCreateMission() {
    this.router.navigate(['/chief']);
  }
}
