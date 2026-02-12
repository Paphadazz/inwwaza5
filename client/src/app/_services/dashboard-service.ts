import { environment } from '../../environments/environment';
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DashboardSummary } from '../_models/dashboard-summary';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private readonly _http = inject(HttpClient);
    private readonly baseUrl = `${environment.baseUrl}/api/dashboard`;

    async getSummary(): Promise<DashboardSummary> {
        return await firstValueFrom(this._http.get<DashboardSummary>(`${this.baseUrl}/summary`));
    }
}