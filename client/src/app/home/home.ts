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
      const currentUserId = this.user()?.id;

      // Fetch Active Missions (owned + joined)
      const myMissions = await this.missionService.getMyMissions();
      const joinedMissions = await this.missionService.getJoined();

      // Merge, deduplicate, and limit
      const combined = [...myMissions, ...joinedMissions];
      const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
      this.activeMissions.set(unique.slice(0, 5));

      // Fetch Featured/Open Missions
      const allOpen = await this.missionService.getByFilter({ status: 'Open' });

      // Filter out missions owned by the user
      const filtered = allOpen.filter(m => m.chief_id !== currentUserId);

      this.featuredMissions.set(filtered.slice(0, 4));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onOpenWorkspace(id: number) {
    this.router.navigate(['/missions', id, 'workspace']);
  }

  onViewMission(id: number) {
    this.onOpenWorkspace(id);
  }

  async onJoinMission(id: number) {
    try {
      await this.missionService.join(id);
      // After joining, immediately navigate to the workspace
      this.onOpenWorkspace(id);
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
