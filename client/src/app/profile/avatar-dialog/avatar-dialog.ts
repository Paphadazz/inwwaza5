import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { UserService } from '../../_services/user-service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-avatar-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    templateUrl: './avatar-dialog.html',
    styleUrl: './avatar-dialog.scss',
})
export class AvatarDialog {
    private _dialogRef = inject(MatDialogRef<AvatarDialog>);
    private _userService = inject(UserService);
    private _snackBar = inject(MatSnackBar);
    private _cdr = inject(ChangeDetectorRef);

    previewUrl: string | null = null;
    selectedFile: File | null = null;
    base64String: string | null = null;
    isUploading = false;

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                this._snackBar.open('Please select an image file', 'Close', { duration: 3000 });
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                // 2MB
                this._snackBar.open('File size should not exceed 2MB', 'Close', { duration: 3000 });
                return;
            }

            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                this.previewUrl = e.target?.result as string;
                this.base64String = e.target?.result as string;
                this._cdr.detectChanges();
            };
            reader.readAsDataURL(file);
        }
    }

    async upload() {
        if (!this.selectedFile) return;

        this.isUploading = true;
        const error = await this._userService.uploadAvatarImg(this.selectedFile);
        
        setTimeout(() => {
            this.isUploading = false;

            if (error) {
                this._snackBar.open(error, 'Close', { duration: 3000 });
            } else {
                this._snackBar.open('Avatar updated successfully!', 'Close', { duration: 3000 });
                this._dialogRef.close();
            }
            this._cdr.detectChanges();
        }, 0);
    }

    close() {
        this._dialogRef.close();
    }
}
