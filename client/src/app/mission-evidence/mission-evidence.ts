import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MissionService } from '../_services/mission-service';
import { PassportService } from '../_services/passport-service';
import { ViewSubmissionDialog } from '../_dialogs/view-submission/view-submission';

@Component({
  selector: 'app-mission-evidence',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="evidence-container">
      <header class="page-header">
        <div class="header-content">
          <button mat-icon-button routerLink="/missions/{{missionId()}}/workspace">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>Evidence Repository</h1>
        </div>
        
        <div class="header-filters">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Filter by Member</mat-label>
            <mat-select [(ngModel)]="selectedMemberId">
              <mat-option [value]="null">All Members</mat-option>
              <mat-option *ngFor="let member of members()" [value]="member.id">
                {{ member.display_name }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Search Files</mat-label>
            <input matInput [(ngModel)]="searchQuery" placeholder="Filename...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
      </header>

      <div class="active-filters" *ngIf="selectedMemberId || selectedTaskId || searchQuery">
        <div class="filter-chip" *ngIf="selectedMemberId">
          <span class="label">Member:</span>
          <span class="value">{{ getMemberName(selectedMemberId) }}</span>
          <button class="remove-btn" (click)="selectedMemberId = null">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="filter-chip" *ngIf="selectedTaskId">
          <span class="label">Task:</span>
          <span class="value">#{{ selectedTaskId }}</span>
          <button class="remove-btn" (click)="selectedTaskId = null">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="filter-chip" *ngIf="searchQuery">
          <span class="label">Search:</span>
          <span class="value">"{{ searchQuery }}"</span>
          <button class="remove-btn" (click)="searchQuery = ''">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <button class="clear-all-btn" (click)="clearAllFilters()">
          Clear all filters
        </button>
      </div>

      <main class="evidence-grid">
        <div *ngIf="filteredSubmissions().length === 0" class="empty-state">
          <mat-icon>cloud_off</mat-icon>
          <h2>No matching evidence found</h2>
          <p>We couldn't find any files matching your current filters. Try searching for something else or clearing the filters.</p>
        </div>

        <mat-card *ngFor="let sub of filteredSubmissions()" class="evidence-card">
          <div class="card-preview" (click)="viewFull(sub)">
            <img [src]="sub.file_url" *ngIf="isImage(sub.file_type)" alt="Preview">
            <div class="file-icon" *ngIf="!isImage(sub.file_type)" [class]="getFileTypeClass(sub.file_type)">
               <mat-icon>{{ getFileIcon(sub.file_type) }}</mat-icon>
               <span class="file-ext" *ngIf="!isImage(sub.file_type)">{{ getFileExt(sub.file_name) }}</span>
            </div>
            <div class="hover-overlay">
              <mat-icon>zoom_in</mat-icon>
              <span>View Full Detail</span>
            </div>
          </div>
          
          <mat-card-content>
            <div class="file-header">
              <div class="file-info">
                <h3 class="filename">{{ sub.file_name }}</h3>
                <p class="timestamp">
                  <mat-icon>schedule</mat-icon>
                  {{ sub.submitted_at | date:'MMM d, y, h:mm a' }}
                </p>
              </div>
            </div>
            
            <div class="submitter-bar">
              <div class="avatar-container">
                <img [src]="sub.brawler_avatar_url || 'assets/default-avatar.png'" class="avatar" alt="Avatar">
                <div class="status-dot"></div>
              </div>
              <div class="details">
                <span class="name">{{ sub.brawler_name }}</span>
                <span class="task-info" *ngIf="sub.task_id">
                  <mat-icon>assignment</mat-icon>
                  Task #{{ sub.task_id }}
                </span>
                <span class="task-info" *ngIf="!sub.task_id">
                  <mat-icon>folder</mat-icon>
                  General Evidence
                </span>
              </div>
            </div>
          </mat-card-content>
          
          <mat-card-actions align="end">
            <button mat-button color="warn" *ngIf="isChief() || sub.brawler_id === currentUserId()" (click)="deleteSubmission(sub.id)">
              <mat-icon>delete_outline</mat-icon>
              Delete
            </button>
            <button mat-button color="primary" (click)="viewFull(sub)">
              <mat-icon>visibility</mat-icon>
              Details
            </button>
            <a mat-button [href]="sub.file_url" target="_blank">
              <mat-icon>download</mat-icon>
              Raw
            </a>
          </mat-card-actions>
        </mat-card>
      </main>
    </div>
  `,
  styles: [`
    .evidence-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;

      .header-content {
        display: flex;
        align-items: center;
        gap: 8px;
        h1 { margin: 0; font-size: 24px; font-weight: 600; color: #1e293b; }
      }

      .header-filters {
        display: flex;
        gap: 12px;
        mat-form-field { width: 220px; }
      }
    }

    .evidence-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 32px;
    }
    
    .evidence-card {
      border: none;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      
      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      
      .card-preview {
        height: 200px;
        background: #f8fafc;
        position: relative;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        
        img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover;
          transition: transform 0.5s;
        }
        
        &:hover img {
          transform: scale(1.05);
        }
        
        .file-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          
          mat-icon { font-size: 64px; width: 64px; height: 64px; }
          
          &.pdf-file mat-icon { color: #ef4444; }
          &.doc-file mat-icon { color: #3b82f6; }
          &.other-file mat-icon { color: #cbd5e1; }
          
          .file-ext {
            font-size: 11px;
            font-weight: 800;
            background: #f1f5f9;
            color: #475569;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
          }
        }
        
        .hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          transition: all 0.3s;
          backdrop-filter: blur(4px);
          
          mat-icon { font-size: 36px; width: 36px; height: 36px; }
          span { font-weight: 600; font-size: 15px; letter-spacing: 0.5px; }
        }
        
        &:hover .hover-overlay { opacity: 1; }
      }
      
      mat-card-content { padding: 20px; }
      
      .file-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        
        .file-info {
          flex: 1;
          min-width: 0;
          .filename { 
            margin: 0; 
            font-size: 17px; 
            font-weight: 700; 
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
          }
          .timestamp { 
            margin: 6px 0 0; 
            font-size: 13px; 
            color: #64748b; 
            display: flex;
            align-items: center;
            gap: 4px;
            mat-icon { font-size: 14px; width: 14px; height: 14px; }
          }
        }
      }
      
      .submitter-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(241, 245, 249, 0.5);
        border-radius: 12px;
        margin-bottom: 8px;
        
        .avatar-container {
          position: relative;
          .avatar { 
            width: 40px; 
            height: 40px; 
            border-radius: 50%; 
            object-fit: cover; 
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .status-dot {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 10px;
            height: 10px;
            background: #22c55e;
            border: 2px solid white;
            border-radius: 50%;
          }
        }
        
        .details {
          display: flex;
          flex-direction: column;
          .name { font-size: 15px; font-weight: 600; color: #334155; }
          .task-info { 
            font-size: 12px; 
            color: #0284c7; 
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 2px;
          }
        }
      }

      mat-card-actions {
        padding: 8px 16px 16px;
        gap: 8px;
        
        button {
          border-radius: 10px;
          font-weight: 600;
          height: 40px;
          
          &.mat-mdc-button {
            padding: 0 16px;
          }
        }
      }
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 120px 40px;
      color: #94a3b8;
      text-align: center;
      background: rgba(255,255,255,0.4);
      border-radius: 32px;
      border: 2px dashed #e2e8f0;
      
      mat-icon { font-size: 80px; width: 80px; height: 80px; margin-bottom: 24px; color: #cbd5e1; }
      h2 { color: #1e293b; margin-bottom: 12px; font-size: 24px; font-weight: 700; }
      p { font-size: 16px; color: #64748b; max-width: 320px; line-height: 1.6; }
    }

    .active-filters {
      margin-top: -8px;
      margin-bottom: 32px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      .filter-chip {
        display: flex;
        align-items: center;
        background: white;
        padding: 6px 14px;
        border-radius: 100px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        font-size: 14px;
        font-weight: 500;
        color: #475569;
        
        .label { color: #94a3b8; margin-right: 6px; font-weight: 400; }
        .value { color: #0f172a; font-weight: 600; }
        
        .remove-btn {
          border: none;
          background: none;
          margin-left: 8px;
          padding: 2px;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          border-radius: 50%;
          
          &:hover { background: #f1f5f9; color: #ef4444; }
          mat-icon { font-size: 16px; width: 16px; height: 16px; }
        }
      }

      .clear-all-btn {
        font-weight: 600;
        font-size: 14px;
        color: #ef4444;
        background: rgba(239, 68, 68, 0.05);
        border: none;
        padding: 8px 16px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover { background: rgba(239, 68, 68, 0.1); transform: scale(1.05); }
      }
    }
  `]
})
export class MissionEvidence implements OnInit {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _missionService = inject(MissionService);
  private _passportService = inject(PassportService);
  private _dialog = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);

  missionId = signal<number>(0);
  submissions = signal<any[]>([]);
  members = signal<any[]>([]);
  tasks = signal<any[]>([]);
  isChief = signal<boolean>(false);

  selectedMemberId: number | null = null;
  selectedTaskId: number | null = null;
  searchQuery = '';

  filteredSubmissions = computed(() => {
    let subs = this.submissions();

    if (this.selectedMemberId) {
      subs = subs.filter(s => s.brawler_id === this.selectedMemberId);
    }

    if (this.selectedTaskId) {
      subs = subs.filter(s => s.task_id === this.selectedTaskId);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      subs = subs.filter(s => s.file_name.toLowerCase().includes(q));
    }

    return subs;
  });

  async ngOnInit() {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this.missionId.set(parseInt(id));

      const memberId = this._route.snapshot.queryParamMap.get('member');
      if (memberId) {
        this.selectedMemberId = parseInt(memberId);
      }

      const taskId = this._route.snapshot.queryParamMap.get('task');
      if (taskId) {
        this.selectedTaskId = parseInt(taskId);
      }

      await this.loadData();
    }
  }

  async loadData() {
    try {
      const mission = await this._missionService.getById(this.missionId());
      const userId = this._passportService.data()?.id;
      this.isChief.set(mission.chief_id === userId);

      const res = await this._missionService.getWorkspaceMembers(this.missionId());
      this.members.set(res.members);

      // Check if user is a member or chief
      const isMember = res.members.some(m => m.id === userId);
      if (!this.isChief() && !isMember) {
        this._snackBar.open('Access denied: You are not part of this mission', 'Close', { duration: 3000 });
        this._router.navigate(['/missions']);
        return;
      }

      const subs = await this._missionService.getMissionSubmissions(this.missionId());
      this.submissions.set(subs);

      const tsks = await this._missionService.getTasks(this.missionId());
      this.tasks.set(tsks);
    } catch (e) {
      console.error(e);
      this._snackBar.open('Error loading repository data', 'Close', { duration: 3000 });
    }
  }

  currentUserId() {
    return this._passportService.data()?.id;
  }

  getFileIcon(type: string): string {
    if (type?.includes('pdf')) return 'picture_as_pdf';
    if (type?.includes('word') || type?.includes('officedocument')) return 'description';
    return 'insert_drive_file';
  }

  getFileTypeClass(type: string): string {
    if (type?.includes('pdf')) return 'pdf-file';
    if (type?.includes('word') || type?.includes('officedocument')) return 'doc-file';
    return 'other-file';
  }

  getFileExt(name: string): string {
    return name?.split('.').pop()?.toUpperCase() || 'FILE';
  }

  async deleteSubmission(submissionId: number) {
    if (!confirm('Are you sure you want to delete this evidence?')) return;

    try {
      await this._missionService.deleteSubmission(this.missionId(), submissionId);
      this._snackBar.open('Evidence deleted successfully', 'Close', { duration: 3000 });
      await this.loadData();
    } catch (e) {
      console.error(e);
      this._snackBar.open('Error deleting evidence', 'Close', { duration: 3000 });
    }
  }

  isImage(type: string): boolean {
    return type?.startsWith('image/');
  }

  viewFull(submission: any) {
    this._dialog.open(ViewSubmissionDialog, {
      data: {
        submission,
        task: this.tasks().find(t => t.id === submission.task_id) || { title: 'General Work' },
        missionId: this.missionId()
      },
      width: '600px'
    });
  }

  getMemberName(id: number): string {
    return this.members().find(m => m.id === id)?.display_name || 'Unknown';
  }

  clearAllFilters() {
    this.selectedMemberId = null;
    this.selectedTaskId = null;
    this.searchQuery = '';
  }
}
