import { Component, inject } from '@angular/core';
import { PassportService } from '../_services/passport-service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private _passport = inject(PassportService);
  private _router = inject(Router);
  private _http = inject(HttpClient);

  constructor() {
    if (!this._passport.data()) {
      this._router.navigate(['/login']);
    }
  }

  onError(code: number) {
    this._http.get(environment.baseUrl + '/api/error/' + code).subscribe({
      error: (e) => console.error(e),
    });
  }
}