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
  private base = environment.apiUrl;

  private headers(): HttpHeaders {
    const token = localStorage.getItem('qma_jwt');
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  // AUTH endpoints (User Service via Gateway)
  login(username: string, password: string): Observable<{ status: number; token: string }> {
    return this.http.post<any>(`${this.base}/auth/login`, { username, password });
  }

  register(username: string, password: string): Observable<string> {
    return this.http.post(`${this.base}/auth/register`, { username, password }, { responseType: 'text' });
  }

  // MEASUREMENT endpoints (Measurement Service via Gateway)
  compare(payload: QuantityMeasurementDTO): Observable<any> {
    return this.http.post(`${this.base}/measurement/compare`, payload, { headers: this.headers() });
  }

  add(payload: QuantityMeasurementDTO): Observable<any> {
    return this.http.post(`${this.base}/measurement/add`, payload, { headers: this.headers() });
  }

  subtract(payload: QuantityMeasurementDTO): Observable<any> {
    return this.http.post(`${this.base}/measurement/subtract`, payload, { headers: this.headers() });
  }

  divide(payload: QuantityMeasurementDTO): Observable<any> {
    return this.http.post(`${this.base}/measurement/divide`, payload, { headers: this.headers() });
  }

  convert(payload: QuantityMeasurementDTO): Observable<any> {
    return this.http.post(`${this.base}/measurement/convert`, payload, { headers: this.headers() });
  }

  // ── NEW: Fetch history for the logged-in user from backend ──────────────
  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/measurement/history`, { headers: this.headers() });
  }

  clearHistory(): Observable<void> {
    return this.http.delete<void>(`${this.base}/measurement/history`, { headers: this.headers() });
  }
}
