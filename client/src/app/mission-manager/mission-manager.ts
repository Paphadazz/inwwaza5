import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DatePipe } from '@angular/common';
import { MissionService } from '../_services/mission-service';
import { Mission } from '../_models/mission';
import { NewMission } from '../_dialogs/new-mission/new-mission';
import { AddMission } from '../_models/add-mission';
import { BehaviorSubject } from 'rxjs';

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
  
  private _missionsSubject = new BehaviorSubject<Mission[]>([])
  readonly myMissions$ = this._missionsSubject.asObservable()

  constructor() {
    this.loadMyMissions()
  }

  private async loadMyMissions() {
    try {
      const missions = await this._missionService.getMyMissions()
      this._missionsSubject.next(missions)
    } catch (e) {
      console.error(e)
    }
  }

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
          status: 'Open',
          chief_id: 0,
          crew_count: 0,
          created_at: now,
          updated_at: now
        }
        
        const currentMissions = this._missionsSubject.value
        this._missionsSubject.next([...currentMissions, newMission])
      } catch (err) {
        console.error('Failed to add mission', err)
      }
    })
  }
}
