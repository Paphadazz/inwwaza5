import { Component, inject } from '@angular/core';
import { PassportService } from '../_services/passport-service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  _passport = inject(PassportService);
  private _router = inject(Router);
  private _http = inject(HttpClient);

  constructor() {
  }

  onError(code: number) {
    this._http.get(environment.baseUrl + '/api/error/' + code).subscribe({
      error: (e) => console.error(e),
    });
  }
}
