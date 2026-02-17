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

    async updateMaxMembers(newMax: string) {
        const val = parseInt(newMax);
        if (isNaN(val) || val < 1) return;
        try {
            await this._missionService.updateSettings(this.missionId(), { max_members: val });
            this._snackBar.open('Max members updated', 'Close', { duration: 2000 });
            await this.loadData();
        } catch (e) {
            console.error(e);
            this._snackBar.open('Error updating team size', 'Close', { duration: 3000 });
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

    navigateToDashboard() {
        this._router.navigate(['/dashboard']);
    }
}
