import { Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
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
    MatSelectModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './new-mission.html',
  styleUrl: './new-mission.scss'
})
export class NewMission {
  private readonly _dialogRef = inject(MatDialogRef<NewMission>)
  private readonly _data = inject(MAT_DIALOG_DATA, { optional: true })

  addMission: AddMission = {
    name: this._data?.name ?? '',
    description: this._data?.description ?? '',
    max_members: this._data?.max_members ?? 10,
    status: this._data?.status ?? 'Open'
  }

  isEdit = !!this._data;

  onSubmit() {
    const mission = this.clean(this.addMission)
    this._dialogRef.close(mission)
  }

  private clean(addMission: AddMission): AddMission {
    return {
      name: addMission.name.trim() || 'untitle',
      description: addMission.description ? addMission.description.trim() : undefined,
      max_members: addMission.max_members,
      status: addMission.status
    }
  }
}
