import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ViewSubmissionDialog } from '../view-submission/view-submission';

@Component({
    selector: 'app-member-submissions',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatListModule],
    template: `
    <h2 mat-dialog-title>Evidence from {{ data.member.display_name }}</h2>
    <mat-dialog-content>
      <div *ngIf="memberSubmissions.length === 0" class="empty-state">
        <mat-icon>cloud_off</mat-icon>
        <p>No evidence submitted by this member yet.</p>
      </div>

      <mat-list>
        <mat-list-item *ngFor="let sub of memberSubmissions">
          <mat-icon matListItemIcon>attach_file</mat-icon>
          <div matListItemTitle>{{ sub.file_name }}</div>
          <div matListItemLine>{{ sub.submitted_at | date:'medium' }}</div>
          <div matListItemMeta>
            <button mat-icon-button color="primary" (click)="viewFull(sub)">
              <mat-icon>visibility</mat-icon>
            </button>
          </div>
        </mat-list-item>
      </mat-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
    styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      color: #94a3b8;
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    }
  `]
})
export class MemberSubmissionsDialog {
    private _dialog = inject(MatDialog);
    memberSubmissions: any[] = [];

    constructor(@Inject(MAT_DIALOG_DATA) public data: { member: any, submissions: any[], tasks: any[] }) {
        this.memberSubmissions = data.submissions.filter(s => s.brawler_id === data.member.id);
    }

    viewFull(submission: any) {
        this._dialog.open(ViewSubmissionDialog, {
            data: {
                submission,
                task: this.data.tasks.find(t => t.id === submission.task_id) || { title: 'General Work' }
            },
            width: '600px'
        });
    }
}
