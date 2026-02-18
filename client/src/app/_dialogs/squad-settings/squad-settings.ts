import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-squad-settings',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        FormsModule
    ],
    template: `
    <h2 mat-dialog-title>Squad Configuration</h2>
    <mat-dialog-content>
      <div class="settings-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Max Operatives</mat-label>
          <input matInput type="number" [(ngModel)]="data.max_members" min="1">
          <mat-hint>Set team size limit</mat-hint>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" (click)="onSave()">Save Changes</button>
    </mat-dialog-actions>
  `,
    styles: [`
    .settings-form {
      padding: 10px 0;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class SquadSettings {
    readonly data = inject(MAT_DIALOG_DATA);
    private _dialogRef = inject(MatDialogRef<SquadSettings>);

    onCancel() {
        this._dialogRef.close();
    }

    onSave() {
        this._dialogRef.close(this.data);
    }
}
