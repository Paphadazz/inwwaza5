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
  private _api_url = environment.baseUrl + '/api'
  private _http = inject(HttpClient)

  filter: MissionFilter = {}

  async getByFilter(filter: MissionFilter): Promise<Mission[]> {  
    const queryString = this.createQueryString(filter)
    const url = this._api_url + '/view/filter?' + queryString     
    const missions = await firstValueFrom(this._http.get<Mission[]>(url))
    return missions
  }

  async getById(id: number): Promise<Mission> {
    const url = this._api_url + '/view/' + id
    return await firstValueFrom(this._http.get<Mission>(url))     
  }

  async getMyMissions(): Promise<Mission[]> {
    const url = this._api_url + '/brawler/my-missions'
    const observable = this._http.get<Mission[]>(url)
    const missions = await firstValueFrom(observable)
    return missions
  }

  async add(mission: AddMission): Promise<number> {
    const url = this._api_url + '/mission-management'
    const observable = this._http.post<{ mission_id: number }>(url, mission)
    const resp = await firstValueFrom(observable)
    return resp.mission_id
  }

  async update(id: number, mission: EditMission): Promise<void> { 
    const url = this._api_url + '/mission-management/' + id       
    await firstValueFrom(this._http.patch(url, mission))
  }

  async delete(id: number): Promise<void> {
    const url = this._api_url + '/mission-management/' + id       
    await firstValueFrom(this._http.delete(url))
  }

  async join(missionId: number): Promise<void> {
    const url = this._api_url + '/crew-operation/join/' + missionId
    await firstValueFrom(this._http.post(url, {}))
  }

  async leave(missionId: number): Promise<void> {
    const url = this._api_url + '/crew-operation/leave/' + missionId
    await firstValueFrom(this._http.delete(url))
  }

  async getCrew(missionId: number): Promise<any[]> {
    const url = this._api_url + '/view/crew/' + missionId
    return await firstValueFrom(this._http.get<any[]>(url))       
  }

  async getWorkspaceMembers(missionId: number): Promise<{ members: any[], count: number, max_count: number }> {
    const url = this._api_url + '/v1/missions/' + missionId + '/members'
    return await firstValueFrom(this._http.get<{ members: any[], count: number, max_count: number }>(url))
  }

  async joinV1(missionId: number): Promise<void> {
    const url = this._api_url + '/v1/missions/' + missionId + '/join'
    await firstValueFrom(this._http.post(url, {}))
  }

  async leaveV1(missionId: number): Promise<void> {
    const url = this._api_url + '/v1/missions/' + missionId + '/leave'
    await firstValueFrom(this._http.delete(url))
  }

  async updateSettings(missionId: number, settings: { max_members: number }): Promise<void> {
    const url = this._api_url + '/v1/missions/' + missionId + '/settings'
    await firstValueFrom(this._http.post(url, settings))
  }

  async getJoined(): Promise<Mission[]> {
    const url = `${this._api_url}/v1/missions/joined`;
    return await firstValueFrom(this._http.get<Mission[]>(url));  
  }

  async updateMemberRole(missionId: number, brawlerId: number, role: String): Promise<void> {
    const url = this._api_url + '/v1/missions/' + missionId + '/members/' + brawlerId + '/role'
    await firstValueFrom(this._http.post(url, { role }))
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
