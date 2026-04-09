import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { DetailDrawerComponent } from './detail-drawer.component';
import { Plume } from '../../../core/models/plume.model';

const mockPlume: Plume = {
  id: 'A0000092',
  satellite: 'GAOFEN-5-01A',
  payload: 'AHSI',
  productLevel: 'L2B',
  overpassTime: '2023-03-19T20:05:43',
  longitude: -103.58,
  latitude: 31.29,
  country: 'United States of America',
  sector: 'Oil and Gas',
  gasType: 'CH4',
  fluxRate: 1423.84,
  fluxRateStd: 599.16,
  windU: -4.9,
  windV: 5.8,
  windSpeed: 7.59,
  detectionInstitution: 'SITP',
  quantificationInstitution: 'SITP',
  feedbackOperator: '',
  feedbackGovernment: '',
  additionalInformation: '',
  sharedOrganization: '',
  geometry: { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] },
  tiffUrl: 'assets/mock/plumes/A0000092_PLUME.tif',
};

describe('DetailDrawerComponent', () => {
  let fixture: ComponentFixture<DetailDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailDrawerComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DetailDrawerComponent);
  });

  it('should not render drawer when plume is null', () => {
    fixture.componentRef.setInput('plume', null);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-drawer]')).toBeNull();
  });

  it('should render drawer with plume data when plume is set', async () => {
    fixture.componentRef.setInput('plume', mockPlume);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-drawer]')).toBeTruthy();
    expect(el.textContent).toContain('A0000092');
    expect(el.textContent).toContain('United States of America');
  });

  it('should display flux rate', async () => {
    fixture.componentRef.setInput('plume', mockPlume);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    // 1423.84 formatted as "1,423.84"
    expect(el.textContent).toContain('1,423.84');
  });

  it('should emit close event when close button clicked', async () => {
    fixture.componentRef.setInput('plume', mockPlume);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const emitSpy = vi.spyOn(fixture.componentInstance.close, 'emit');
    const closeBtnDe = fixture.debugElement.query(By.css('[data-close-btn]'));
    closeBtnDe.triggerEventHandler('click', null);
    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
