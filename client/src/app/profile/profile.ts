import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PassportService } from '../_services/passport-service';
import { DashboardService } from '../_services/dashboard-service';
import { DashboardSummary } from '../_models/dashboard-summary';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AvatarDialog } from './avatar-dialog/avatar-dialog';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  public passportService = inject(PassportService);
  private _dashboardService = inject(DashboardService);
  private _snackBar = inject(MatSnackBar);
  private _router = inject(Router);
  private _dialog = inject(MatDialog);

  isEditing = signal(false);
  editModel = {
    display_name: '',
    bio: ''
  };

  stats = signal<DashboardSummary | undefined>(undefined);

  constructor() {
    const user = this.passportService.data();
    if (user) {
      this.editModel.display_name = user.display_name;
      this.editModel.bio = user.bio || '';
    }
  }

  async ngOnInit() {
    await this.loadStats();
  }

  async loadStats() {
    try {
      const summary = await this._dashboardService.getSummary();
      this.stats.set(summary);
    } catch (error) {
      console.error('Failed to load profile stats', error);
    }
  }

  logout() {
    this.passportService.destroy();
    this._router.navigate(['/login']);
  }

  openAvatarDialog() {
    this._dialog.open(AvatarDialog, {
      width: '400px',
    });
  }

  startEdit() {
    const user = this.passportService.data();
    if (user) {
      this.editModel.display_name = user.display_name;
      this.editModel.bio = user.bio || '';
    }
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  async saveEdit() {
    try {
      await this.passportService.updateProfile(this.editModel);
      this._snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
      this.isEditing.set(false);
    } catch (error: any) {
      this._snackBar.open(error?.error || 'Failed to update profile', 'Close', { duration: 3000 });
    }
  }

  async shareProfile() {
    const user = this.passportService.data();
    if (!user) return;

    const shareUrl = `${window.location.origin}/profile/${user.id}`;
    const shareData = {
      title: `${user.display_name}'s Profile`,
      text: `Check out ${user.display_name}'s profile on MissionLink!`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          this._copyToClipboard(shareUrl);
        }
      }
    } else {
      this._copyToClipboard(shareUrl);
    }
  }

  private _copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this._snackBar.open('Link copied', 'Close', { duration: 3000 });
    });
  }
}
