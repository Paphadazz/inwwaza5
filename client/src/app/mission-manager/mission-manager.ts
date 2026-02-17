import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, DatePipe } from '@angular/common';
import { MissionService } from '../_services/mission-service';
import { PassportService } from '../_services/passport-service';
import { Mission } from '../_models/mission';
import { NewMission } from '../_dialogs/new-mission/new-mission';
import { AddMission } from '../_models/add-mission';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, map } from 'rxjs';
import { EditMission } from '../_models/edit-mission';

@Component({
  selector: 'app-mission-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    DatePipe
  ],
  templateUrl: './mission-manager.html',
  styleUrl: './mission-manager.scss'
})
export class MissionManager {
  private _missionService = inject(MissionService)
  private _dialog = inject(MatDialog)
  public passportService = inject(PassportService)
  private _snackBar = inject(MatSnackBar)
  private _router = inject(Router)

  private _missionsSubject = new BehaviorSubject<Mission[]>([])
  readonly myMissions$ = this._missionsSubject.asObservable()

  constructor() {
    this.loadMyMission()
  }


  private async loadMyMission() {
    try {
      const missions = await this._missionService.getMyMissions()
      this._missionsSubject.next(missions)
    } catch (e) {
      console.error(e)
    }
  }

  readonly ownMissions$ = this._missionsSubject.asObservable().pipe(
    map(missions => missions.filter(m => m.chief_id === this.passportService.data()?.id))
  )

  openDialog() {
    const ref = this._dialog.open(NewMission)
    ref.afterClosed().subscribe(async (addMission: AddMission) => {
      if (!addMission) return;
      try {
        const id = await this._missionService.add(addMission)
        const now = new Date()

        const newMission: Mission = {
          id,
          name: addMission.name,
          description: addMission.description,
          status: addMission.status ?? 'Open',
          chief_id: this.passportService.data()?.id ?? 0,
          chief_display_name: this.passportService.data()?.display_name ?? 'Unknown',
          member_count: 0,
          max_members: addMission.max_members ?? 10,
          created_at: now,
          updated_at: now,
          is_joined: false
        }

        const currentMissions = this._missionsSubject.value
        this._missionsSubject.next([...currentMissions, newMission]) // เพมขอมลใหมเขาไปใน BehaviorSubject
      } catch (err) {
        console.error('Failed to add mission', err)
      }
    })
  }

  async editMission(mission: Mission) {
    const ref = this._dialog.open(NewMission, {
      data: { name: mission.name, description: mission.description, max_members: mission.max_members, status: mission.status }
    })

    ref.afterClosed().subscribe(async (editMission: EditMission) => {
      if (!editMission) return;
      try {
        await this._missionService.update(mission.id, editMission)
        const currentMissions = this._missionsSubject.value
        const index = currentMissions.findIndex(m => m.id === mission.id)
        if (index !== -1) {
          currentMissions[index] = {
            ...currentMissions[index],
            name: editMission.name ?? currentMissions[index].name,
            description: editMission.description ?? currentMissions[index].description,
            status: editMission.status ?? currentMissions[index].status,
            max_members: editMission.max_members ?? currentMissions[index].max_members,
            updated_at: new Date()
          }
          this._missionsSubject.next([...currentMissions])
        }
      } catch (err) {
        console.error('Failed to edit mission', err)
      }
    })
  }

  async deleteMission(id: number) {
    if (confirm('Are you sure you want to delete this mission?')) {
      try {
        await this._missionService.delete(id)
        const currentMissions = this._missionsSubject.value
        this._missionsSubject.next(currentMissions.filter(m => m.id !== id))
      } catch (err: any) {
        console.error('Failed to delete mission', err)
        let errorMessage = 'Failed to delete mission';
        if (err.error) {
          errorMessage = typeof err.error === 'string' ? err.error : (err.error.message || JSON.stringify(err.error));
        }
        this._snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    }
  }

  navigateToWorkspace(missionId: number) {
    this._router.navigate(['/missions', missionId, 'workspace']);
  }
}
