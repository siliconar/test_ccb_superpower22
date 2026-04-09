import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { LatestDetectionsComponent } from './latest-detections.component';
import { PlumeService } from '../../../core/services/plume.service';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Plume } from '../../../core/models/plume.model';

function makePlume(index: number): Plume {
  return {
    id: `P${index.toString().padStart(3, '0')}`,
    satellite: 'TEST-SAT',
    payload: 'AHSI',
    productLevel: 'L2B',
    overpassTime: new Date(2024, 0, index + 1).toISOString(),
    longitude: 0,
    latitude: 0,
    country: 'Testland',
    sector: 'Oil and Gas',
    gasType: 'CH4',
    fluxRate: 100 + index,
    fluxRateStd: 10,
    windU: 1,
    windV: 1,
    windSpeed: 1.4,
    detectionInstitution: 'Test',
    quantificationInstitution: 'Test',
    feedbackOperator: '',
    feedbackGovernment: '',
    additionalInformation: '',
    sharedOrganization: '',
    geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
  };
}

const mockPlumes: Plume[] = Array.from({ length: 15 }, (_, i) => makePlume(i));

describe('LatestDetectionsComponent', () => {
  let fixture: ComponentFixture<LatestDetectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LatestDetectionsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PlumeService,
          useValue: { getPlumes: () => of(mockPlumes) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LatestDetectionsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should show at most 10 plume cards', () => {
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-plume-card]');
    expect(cards.length).toBeLessThanOrEqual(10);
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should show exactly 10 plume cards when 15 plumes are available', () => {
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-plume-card]');
    expect(cards.length).toBe(10);
  });

  it('should show most recent plume first (P014 from index 14)', () => {
    const firstCard = (fixture.nativeElement as HTMLElement).querySelector('[data-plume-card]');
    expect(firstCard!.textContent).toContain('P014');
  });

  it('should have "View on Map" links for each card', () => {
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-plume-card] a');
    expect(links.length).toBeGreaterThan(0);
    expect(Array.from(links).every(l => l.textContent?.includes('Map'))).toBe(true);
  });
});
