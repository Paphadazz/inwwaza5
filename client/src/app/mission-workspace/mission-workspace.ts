import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MissionService } from '../_services/mission-service';
import { PassportService } from '../_services/passport-service';
import { Mission } from '../_models/mission';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { NewTask } from '../_dialogs/new-task/new-task';
import { ViewSubmissionDialog } from '../_dialogs/view-submission/view-submission';
import { SquadSettings } from '../_dialogs/squad-settings/squad-settings';

@Component({
    selector: 'app-mission-workspace',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatChipsModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatMenuModule,
        FormsModule,
        RouterLink
    ],
    templateUrl: './mission-workspace.html',
    styleUrl: './mission-workspace.scss'
})
export class MissionWorkspace implements OnInit {
    private _route = inject(ActivatedRoute);
    private _router = inject(Router);
    private _missionService = inject(MissionService);
    private _passportService = inject(PassportService);
    private _snackBar = inject(MatSnackBar);
    private _dialog = inject(MatDialog);

    missionId = signal<number>(0);
    mission = signal<Mission | null>(null);
    members = signal<any[]>([]);
    tasks = signal<any[]>([]);
    memberCount = signal<number>(0);
    maxMemberCount = signal<number>(0);
    currentUserId = signal<number | undefined>(undefined);
    isUserChief = signal<boolean>(false);
    isSubmitting = signal<boolean>(false);

    availableRoles = ['Member', 'Tactician', 'Combatant', 'Support', 'Sniper', 'Tank', 'Healer'];

    async ngOnInit() {
        const id = this._route.snapshot.paramMap.get('id');
        if (id) {
            this.missionId.set(parseInt(id));
            this.currentUserId.set(this._passportService.data()?.id);
            await this.loadData();
        } else {
            this._router.navigate(['/missions']);
        }
    }

    async loadData() {
        try {
            const res = await this._missionService.getWorkspaceMembers(this.missionId());
            this.members.set(res.members);
            this.memberCount.set(res.count);
            this.maxMemberCount.set(res.max_count);

            const mission = await this._missionService.getById(this.missionId());
            this.mission.set(mission);
            this.isUserChief.set(mission.chief_id === this.currentUserId());

            await this.loadTasks();
        } catch (e) {
            console.error(e);
            this._snackBar.open('Error loading workspace data', 'Close', { duration: 3000 });
        }
    }

    async loadTasks() {
        try {
            const tasks = await this._missionService.getTasks(this.missionId());
            this.tasks.set(tasks);
        } catch (e) {
            console.error('Error loading tasks', e);
        }
    }

    async openSquadSettings() {
        const m = this.mission();
        if (!m) return;

        const ref = this._dialog.open(SquadSettings, {
            width: '350px',
            data: { max_members: m.max_members }
        });

        ref.afterClosed().subscribe(async (result) => {
            if (result) {
                try {
                    await this._missionService.updateSettings(this.missionId(), result);
                    this._snackBar.open('Squad configuration updated', 'Close', { duration: 2000 });
                    await this.loadData();
                } catch (e) {
                    console.error(e);
                    this._snackBar.open('Error updating squad settings', 'Close', { duration: 3000 });
                }
            }
        });
    }

    async leave() {
        try {
            await this._missionService.leaveV1(this.missionId());
            this._snackBar.open('You have left the mission', 'Close', { duration: 3000 });
            this._router.navigate(['/missions']);
        } catch (e) {
            console.error(e);
            this._snackBar.open('Error leaving mission', 'Close', { duration: 3000 });
        }
    }

    async updateRole(memberId: number, newRole: string) {
        try {
            await this._missionService.updateMemberRole(this.missionId(), memberId, newRole);
            this._snackBar.open('Member role updated', 'Close', { duration: 2000 });
            await this.loadData();
        } catch (e) {
            console.error(e);
            this._snackBar.open('Error updating member role', 'Close', { duration: 3000 });
        }
    }

    isChief(member: any): boolean {
        return member.id === this.mission()?.chief_id;
    }

    isCurrentUser(member: any): boolean {
        return member.id === this.currentUserId();
    }

    async kickMember(memberId: number) {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await this._missionService.kickMember(this.missionId(), memberId);
            this._snackBar.open('Member removed', 'Close', { duration: 2000 });
            await this.loadData();
        } catch (e) {
            console.error(e);
            this._snackBar.open('Error removing member', 'Close', { duration: 3000 });
        }
    }

    createTask() {
        const ref = this._dialog.open(NewTask, {
            data: { members: this.members() }
        });

        ref.afterClosed().subscribe(async (result) => {
            if (result) {
                try {
                    await this._missionService.createTask(this.missionId(), result);
                    this._snackBar.open('Task created', 'Close', { duration: 2000 });
                    await this.loadTasks();
                } catch (e) {
                    console.error(e);
                    this._snackBar.open('Error creating task', 'Close', { duration: 3000 });
                }
            }
        });
    }

    async deleteTask(taskId: number) {
        if (!confirm('Delete this task?')) return;
        try {
            await this._missionService.deleteTask(this.missionId(), taskId);
            this._snackBar.open('Task deleted', 'Close', { duration: 2000 });
            await this.loadTasks();
        } catch (e) {
            console.error(e);
            this._snackBar.open('Error deleting task', 'Close', { duration: 3000 });
        }
    }

    selectedTaskId: number | null = null;

    triggerFileInput(taskId?: number) {
        this.selectedTaskId = taskId || null;
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        fileInput.click();
    }

    async onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.isSubmitting.set(true);
            try {
                await this._missionService.submitWork(this.missionId(), file, this.selectedTaskId || undefined);
                this._snackBar.open('Work submitted successfully', 'Close', { duration: 3000 });
                await this.loadTasks(); // Refresh tasks to show status if affected
            } catch (e) {
                console.error(e);
                this._snackBar.open('Error submitting work', 'Close', { duration: 3000 });
            } finally {
                this.isSubmitting.set(false);
                this.selectedTaskId = null;
                // Reset file input
                event.target.value = '';
            }
        }
    }

    async viewSubmission(taskId: number) {
        const task = this.tasks().find(t => t.id === taskId);
        if (task && task.member_id) {
            this._router.navigate(['/missions', this.missionId(), 'evidence'], {
                queryParams: { member: task.member_id, task: taskId }
            });
        } else {
            this.goToEvidence();
        }
    }

    async deleteSubmission(taskId: number) {
        const task = this.tasks().find(t => t.id === taskId);
        if (!task) return;

        if (!confirm('Retract this submission and delete the file?')) return;

        try {
            const submission = await this._missionService.getTaskSubmission(this.missionId(), taskId);
            if (submission) {
                await this._missionService.deleteSubmission(this.missionId(), submission.id);
                this._snackBar.open('Submission retracted successfully', 'Close', { duration: 3000 });
                await this.loadTasks();
            }
        } catch (e) {
            console.error(e);
            this._snackBar.open('Error retracting submission', 'Close', { duration: 3000 });
        }
    }

    async updateTaskStatus(taskId: number, newStatus: string) {
        try {
            await this._missionService.updateTask(this.missionId(), taskId, { status: newStatus });
            this._snackBar.open(`Task status updated to ${newStatus}`, 'Close', { duration: 2000 });
            await this.loadTasks();
        } catch (e) {
            console.error(e);
            this._snackBar.open('Error updating task status', 'Close', { duration: 3000 });
        }
    }

    viewMemberEvidence(member: any) {
        this._router.navigate(['/missions', this.missionId(), 'evidence'], {
            queryParams: { member: member.id }
        });
    }

    goToEvidence() {
        this._router.navigate(['/missions', this.missionId(), 'evidence']);
    }

    navigateToDashboard() {
        this._router.navigate(['/dashboard']);
    }
}
