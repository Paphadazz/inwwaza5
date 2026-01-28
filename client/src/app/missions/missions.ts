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
    MatDialogModule
  ],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions {
  private _mission = inject(MissionService)
  private _dialog = inject(MatDialog)
  private _passport = inject(PassportService)

  filter: MissionFilter = {}

  private _missionsSubject = new BehaviorSubject<Mission[]>([])   
  readonly missions$ = this._missionsSubject.asObservable()       

  isSignin = computed(() => this._passport.isSignin())

  constructor() {
    this.filter = this._mission.filter
    this.onSubmit();
  }

  async onSubmit() {
    const missions = await this._mission.getByFilter(this.filter) 
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
}
