import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MissionService } from '../../_services/mission-service';
import { PassportService } from '../../_services/passport-service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-view-submission',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatDividerModule,
        MatChipsModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule
    ],
    templateUrl: './view-submission.html',
    styleUrl: './view-submission.scss'
})
export class ViewSubmissionDialog {
    private _missionService = inject(MissionService);
    private _passportService = inject(PassportService);
    private _snackBar = inject(MatSnackBar);

    description = signal<string>('');
    isSaving = signal<boolean>(false);
    canEdit = signal<boolean>(false);

    constructor(
        public dialogRef: MatDialogRef<ViewSubmissionDialog>,
        @Inject(MAT_DIALOG_DATA) public data: { submission: any, task: any, missionId: number }
    ) {
        this.description.set(this.data.submission.description || '');
        const currentUserId = this._passportService.data()?.id;
        this.canEdit.set(this.data.submission.brawler_id === currentUserId);
    }

    isImage(type: string): boolean {
        return type.toLowerCase().includes('image') ||
            ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => type.toLowerCase().includes(ext));
    }

    async saveDetails(): Promise<void> {
        this.isSaving.set(true);
        try {
            await this._missionService.updateSubmissionDetails(this.data.missionId, this.data.submission.id, this.description());
            this._snackBar.open('Details updated successfully', 'Close', { duration: 3000 });
            this.data.submission.description = this.description();
        } catch (e) {
            console.error(e);
            this._snackBar.open('Error updating details', 'Close', { duration: 3000 });
        } finally {
            this.isSaving.set(false);
        }
    }

    close(): void {
        this.dialogRef.close();
    }

    download(): void {
        window.open(this.data.submission.file_url, '_blank');
    }
}
