import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    isDark = signal<boolean>(false);

    constructor() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            this.isDark.set(true);
            document.body.classList.add('dark-mode');
        }
    }

    toggle() {
        const next = !this.isDark();
        this.isDark.set(next);
        if (next) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    }
}
