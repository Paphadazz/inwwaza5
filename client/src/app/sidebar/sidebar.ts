import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    RouterLinkActive, 
    MatIconModule, 
    MatListModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  @Input() isCollapsed = false;

  menuItems = [
    { label: 'Home', icon: 'home', route: '/' },
    { label: 'Missions', icon: 'explore', route: '/missions' },
    { label: 'Overview', icon: 'dashboard', route: '/dashboard' },
    { label: 'My Missions', icon: 'assignment', route: '/chief' },
    { label: 'Joined Missions', icon: 'group_work', route: '/missions/joined' }
  ];
}
