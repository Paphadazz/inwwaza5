import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AddMission } from '../../_models/add-mission';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-mission',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './new-mission.html',
  styleUrl: './new-mission.scss'
})
export class NewMission {
  addMission: AddMission = {
    name: '',
    description: ''
  }
  private readonly _dialogRef = inject(MatDialogRef<NewMission>)

  onSubmit() {
    const mission = this.clean(this.addMission)
    this._dialogRef.close(mission)
  }

  private clean(addMission: AddMission): AddMission {
    return {
        name: addMission.name.trim() || 'untitle',
        description: addMission.description ? addMission.description.trim() : undefined
    }
  }
}
