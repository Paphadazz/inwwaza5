import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionService } from '../_services/mission-service';
import { Mission } from '../_models/mission';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-joined-missions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './joined-missions.html',
  styleUrl: './joined-missions.scss'
})
export class JoinedMissions implements OnInit {
  private _missionService = inject(MissionService);
  private _router = inject(Router);
  private _snackBar = inject(MatSnackBar);

  missions = signal<Mission[]>([]);
  loading = signal<boolean>(true);

  async ngOnInit() {
    await this.loadMissions();
  }

  async loadMissions() {
    try {
      this.loading.set(true);
      const data = await this._missionService.getJoined();
      this.missions.set(data);
    } catch (e) {
      console.error('Failed to load joined missions', e);
      this._snackBar.open('Failed to load missions', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async leaveMission(missionId: number) {
    if (!confirm('Are you sure you want to leave this mission?')) {
      return;
    }

    try {
      await this._missionService.leaveV1(missionId);
      
      // Update UI immediately
      this.missions.update(current => current.filter(m => m.id !== missionId));
      
      this._snackBar.open('You have left the mission.', 'Close', { duration: 3000 });
      
      // Note: Dashboard counts will update when user navigates back to Dashboard/Profile
      // or we could inject DashboardService to refresh if needed.
    } catch (e: any) {
      console.error('Failed to leave mission', e);
      const errorMessage = e.error?.message || e.message || 'Unable to leave mission';
      this._snackBar.open(errorMessage, 'Close', { duration: 3000 });
    }
  }

  openWorkspace(missionId: number) {
    this._router.navigate(['/missions', missionId, 'workspace']);
  }
}
