import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DEFAULT_FILTER, FilterCriteria, Plume, Stats } from '../models/plume.model';
import { PlumeService } from './plume.service';

@Injectable()
export class MockPlumeService extends PlumeService {
  private http = inject(HttpClient);

  getPlumes(filter: FilterCriteria = DEFAULT_FILTER): Observable<Plume[]> {
    return this.http.get<Plume[]>('assets/mock/plumes.json').pipe(
      map(plumes => this.applyFilter(plumes, filter))
    );
  }

  getPlumeById(id: string): Observable<Plume> {
    return this.http.get<Plume[]>('assets/mock/plumes.json').pipe(
      map(plumes => {
        const found = plumes.find(p => p.id === id);
        if (!found) throw new Error(`Plume ${id} not found`);
        return found;
      })
    );
  }

  getStats(): Observable<Stats> {
    return this.http.get<Plume[]>('assets/mock/plumes.json').pipe(
      map(plumes => {
        const countries = new Set(plumes.map(p => p.country));
        const gasTypes = new Set(plumes.map(p => p.gasType));
        const sorted = [...plumes].sort((a, b) =>
          new Date(b.overpassTime).getTime() - new Date(a.overpassTime).getTime()
        );
        return {
          totalDetections: plumes.length,
          countriesCount: countries.size,
          gasTypesCount: gasTypes.size,
          latestDetectionDate: sorted[0]?.overpassTime ?? '',
        };
      })
    );
  }

  private applyFilter(plumes: Plume[], filter: FilterCriteria): Plume[] {
    return plumes.filter(p => {
      if (filter.gasTypes.length && !filter.gasTypes.includes(p.gasType)) return false;
      if (filter.satellites.length && !filter.satellites.includes(p.satellite)) return false;
      if (filter.sectors?.length && !filter.sectors.includes(p.sector)) return false;
      if (filter.dateRange.start && new Date(p.overpassTime) < new Date(filter.dateRange.start)) return false;
      if (filter.dateRange.end && new Date(p.overpassTime) > new Date(filter.dateRange.end)) return false;
      if (filter.fluxRateRange) {
        if (p.fluxRate < filter.fluxRateRange.min || p.fluxRate > filter.fluxRateRange.max) return false;
      }
      return true;
    });
  }
}
