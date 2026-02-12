import { Routes } from '@angular/router'
import { Home } from './home/home'
import { Login } from './login/login'
import { Profile } from './profile/profile'
import { ServerError } from './server-error/server-error'
import { NotFound } from './not-found/not-found'
import { authGuard } from './_guard/auth-guard'
import { Missions } from './missions/missions'
import { MissionManager } from './mission-manager/mission-manager'
import { MissionWorkspace } from './mission-workspace/mission-workspace'
import { Dashboard } from './dashboard/dashboard'
import { JoinedMissions } from './joined-missions/joined-missions'

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'login', component: Login },
    { path: 'profile', component: Profile, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'missions', component: Missions, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'missions/joined', component: JoinedMissions, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'missions/:id/workspace', component: MissionWorkspace, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'my-mission', component: MissionManager, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'chief', component: MissionManager, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
    { path: 'server-error', component: ServerError },
    { path: '**', component: NotFound },
]
