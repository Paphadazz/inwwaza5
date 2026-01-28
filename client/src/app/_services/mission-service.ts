import { inject, Injectable } from '@angular/core'
import { environment } from '../../environments/environment'
import { HttpClient } from '@angular/common/http'
import { MissionFilter } from '../_models/mission-filter'
import { firstValueFrom } from 'rxjs'
import { Mission } from '../_models/mission'
import { AddMission } from '../_models/add-mission'
import { EditMission } from '../_models/edit-mission'

@Injectable({
  providedIn: 'root',
})
export class MissionService {
  private _base_url = environment.baseUrl + '/api'
  private _http = inject(HttpClient)

  filter: MissionFilter = {}

  async getByFilter(filter: MissionFilter): Promise<Mission[]> {  
    const queryString = this.createQueryString(filter)
    const url = this._base_url + '/view/filter?' + queryString    
    const missions = await firstValueFrom(this._http.get<Mission[]>(url))
    return missions
  }

  async getMyMissions(): Promise<Mission[]> {
    const url = this._base_url + '/brawler/missions'
    return await firstValueFrom(this._http.get<Mission[]>(url))   
  }

  async add(mission: AddMission): Promise<number> {
    const url = this._base_url + '/mission-management'
    const observable = this._http.post<{ mission_id: number }>(url, mission)
    const resp = await firstValueFrom(observable)
    return resp.mission_id
  }

  async update(id: number, mission: EditMission): Promise<void> {
    const url = this._base_url + '/mission-management/' + id
    await firstValueFrom(this._http.patch(url, mission))
  }

  async delete(id: number): Promise<void> {
    const url = this._base_url + '/mission-management/' + id
    await firstValueFrom(this._http.delete(url))
  }

  private createQueryString(filter: MissionFilter): string {      
    this.filter = filter
    const params: string[] = []

    if (filter.name && filter.name.trim()) {
      params.push(`name=${filter.name}`)
    }
    if (filter.status) {
      params.push(`status=${filter.status}`)
    }

    return params.join('&')
  }
}
