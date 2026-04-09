import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterCriteria, Plume, Stats } from '../models/plume.model';

@Injectable()
export abstract class PlumeService {
  abstract getPlumes(filter: FilterCriteria): Observable<Plume[]>;
  abstract getPlumeById(id: string): Observable<Plume>;
  abstract getStats(): Observable<Stats>;
}
