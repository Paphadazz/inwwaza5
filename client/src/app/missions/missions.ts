import { Component, inject, computed } from '@angular/core';
import { MissionService } from '../_services/mission-service';
import { PassportService } from '../_services/passport-service';
import { Mission } from '../_models/mission';
import { MissionFilter } from '../_models/mission-filter';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { NewMission } from '../_dialogs/new-mission/new-mission';
import { AddMission } from '../_models/add-mission';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions {
  private _mission = inject(MissionService)
  private _dialog = inject(MatDialog)
  private _passportService = inject(PassportService)
  private _router = inject(Router)
  private _snackBar = inject(MatSnackBar)

  filter: MissionFilter = {}

  private _missionsSubject = new BehaviorSubject<Mission[]>([])
  readonly missions$ = this._missionsSubject.asObservable()

  isSignin: any;
  currentUserId: any;

  constructor() {
    this.isSignin = computed(() => this._passportService.isSignin())
    this.currentUserId = computed(() => this._passportService.data()?.id)
    this.filter = this._mission.filter
    this.onSubmit();
  }

  async onSubmit() {
    let missions = await this._mission.getByFilter(this.filter)

    if (this.isSignin()) {
      const userId = this.currentUserId()
      missions = missions.filter(m => m.chief_id !== userId && !m.is_joined)
    }

    this._missionsSubject.next(missions)
  }

  openAddMissionDialog() {
    const dialogRef = this._dialog.open(NewMission, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(async (result: AddMission | undefined) => {
      if (result) {
        try {
          await this._mission.add(result);
          await this.onSubmit();
        } catch (error) {
          console.error('Failed to add mission', error);
        }
      }
    });
  }

  async onJoin(missionId: number) {
    try {
      await this._mission.joinV1(missionId)

      // Remove the joined mission from the current list
      const currentMissions = this._missionsSubject.value
      const updatedMissions = currentMissions.filter(m => m.id !== missionId)
      this._missionsSubject.next(updatedMissions)

      this._snackBar.open('You have joined the mission successfully', 'Close', { duration: 3000 });
      this._router.navigate(['/missions', missionId, 'workspace']);
    } catch (e) {
      console.error(e)
      this._snackBar.open('Failed to join mission', 'Close', { duration: 3000 });
    }
  }

  async onLeave(missionId: number) {
    try {
      await this._mission.leaveV1(missionId)
      await this.onSubmit()
    } catch (e) {
      console.error(e)
    }
  }
}
