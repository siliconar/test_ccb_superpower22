import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { PlumeService } from '../../core/services/plume.service';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

// Mock maplibre-gl before import
vi.mock('maplibre-gl', () => {
  const mockMap = {
    on: vi.fn(),
    remove: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getSource: vi.fn(() => ({ setData: vi.fn() })),
    getLayer: vi.fn(() => null),
    flyTo: vi.fn(),
    getCanvas: vi.fn(() => ({ style: { cursor: '' } })),
    queryRenderedFeatures: vi.fn(() => []),
  };
  return {
    default: { Map: vi.fn(() => mockMap) },
    Map: vi.fn(() => mockMap),
  };
});

describe('MapComponent', () => {
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PlumeService, useValue: { getPlumes: () => of([]), getPlumeById: () => of(null), getStats: () => of(null) } },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of({ get: () => null }) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MapComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create map component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render nav bar with Home link', () => {
    const el = fixture.nativeElement as HTMLElement;
    const nav = el.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav!.textContent).toContain('GasWatch');
    const homeLink = nav!.querySelector('a[routerLink="/"]') ?? nav!.querySelector('a[href="/"]');
    expect(homeLink).toBeTruthy();
  });

  it('should render map container div with id="map-container"', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#map-container')).toBeTruthy();
  });
});
