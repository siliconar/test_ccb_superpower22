import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { StatsBarComponent } from './stats-bar.component';
import { PlumeService } from '../../../core/services/plume.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Stats } from '../../../core/models/plume.model';

const mockStats: Stats = {
  totalDetections: 1234,
  countriesCount: 42,
  gasTypesCount: 3,
  latestDetectionDate: '2024-01-15T10:00:00',
};

describe('StatsBarComponent', () => {
  let fixture: ComponentFixture<StatsBarComponent>;

  beforeEach(async () => {
    // Mock IntersectionObserver for jsdom
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      value: class {
        observe = () => {};
        disconnect = () => {};
        unobserve = () => {};
      },
    });

    await TestBed.configureTestingModule({
      imports: [StatsBarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PlumeService,
          useValue: { getStats: () => of(mockStats) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(StatsBarComponent);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should render 4 stat items with [data-stat] attribute', () => {
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-stat]');
    expect(items.length).toBe(4);
  });

  it('should display "Total Detections" label', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Total Detections');
  });

  it('should display "1,234" as total detections value', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('1,234');
  });

  it('should display "42" as countries count', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('42');
  });
});
