import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
    selector: 'app-new-task',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDialogModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    templateUrl: './new-task.html',
    styleUrl: './new-task.scss'
})
export class NewTask implements OnInit {
    task: any = {
        title: '',
        description: '',
        member_id: null,
        priority: 'Medium',
        start_date: null,
        end_date: null
    };

    members: any[] = [];

    constructor(
        public dialogRef: MatDialogRef<NewTask>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        if (data.members) {
            this.members = data.members;
        }
    }

    ngOnInit() {
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        this.dialogRef.close(this.task);
    }
}
