import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterCriteria, Plume, Stats } from '../models/plume.model';
import { PlumeService } from './plume.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class ApiPlumeService extends PlumeService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getPlumes(filter: FilterCriteria): Observable<Plume[]> {
    let params = new HttpParams();
    if (filter.gasTypes.length) params = params.set('gasType', filter.gasTypes.join(','));
    if (filter.satellites.length) params = params.set('satellite', filter.satellites.join(','));
    if (filter.sectors?.length) params = params.set('sector', filter.sectors.join(','));
    if (filter.dateRange.start) params = params.set('dateFrom', filter.dateRange.start);
    if (filter.dateRange.end) params = params.set('dateTo', filter.dateRange.end);
    if (filter.fluxRateRange) {
      params = params.set('fluxMin', filter.fluxRateRange.min);
      params = params.set('fluxMax', filter.fluxRateRange.max);
    }
    return this.http.get<Plume[]>(`${this.base}/api/plumes`, { params });
  }

  getPlumeById(id: string): Observable<Plume> {
    return this.http.get<Plume>(`${this.base}/api/plumes/${id}`);
  }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.base}/api/stats`);
  }
}
