import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface QuantityDTO { value: number; unit: string; }
export interface QuantityMeasurementDTO {
  thisQuantityDTO: QuantityDTO;
  thatQuantityDTO: QuantityDTO;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private measurementBase = environment.measurementUrl ?? environment.apiUrl;
  private authBase = environment.authUrl ?? environment.apiUrl;

  private headers(): HttpHeaders {
    const token = localStorage.getItem('qma_jwt');
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  // AUTH endpoints (User Service via Gateway)
  login(username: string, password: string): Observable<{ status: number; token: string }> {
    return this.http.post<any>(`${this.authBase}/auth/login`, { username, password });
  }

  register(username: string, password: string): Observable<string> {
    return this.http.post(`${this.authBase}/auth/register`, { username, password }, { responseType: 'text' });
  }

  // MEASUREMENT endpoints (Measurement Service via Gateway)
  compare(payload: QuantityMeasurementDTO): Observable<any> {
    return this.http.post(`${this.measurementBase}/measurement/compare`, payload, { headers: this.headers() });
  }

  add(payload: QuantityMeasurementDTO): Observable<any> {
    return this.http.post(`${this.measurementBase}/measurement/add`, payload, { headers: this.headers() });
  }

  subtract(payload: QuantityMeasurementDTO): Observable<any> {
    return this.http.post(`${this.measurementBase}/measurement/subtract`, payload, { headers: this.headers() });
  }

  divide(payload: QuantityMeasurementDTO): Observable<any> {
    return this.http.post(`${this.measurementBase}/measurement/divide`, payload, { headers: this.headers() });
  }

  convert(payload: QuantityMeasurementDTO): Observable<any> {
    return this.http.post(`${this.measurementBase}/measurement/convert`, payload, { headers: this.headers() });
  }

  // ── NEW: Fetch history for the logged-in user from backend ──────────────
  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.measurementBase}/measurement/history`, { headers: this.headers() });
  }

  clearHistory(): Observable<void> {
    return this.http.delete<void>(`${this.measurementBase}/measurement/history`, { headers: this.headers() });
  }
}
