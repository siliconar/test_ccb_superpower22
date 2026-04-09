import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { FilterPanelComponent } from './filter-panel.component';
import { FilterCriteria } from '../../../core/models/plume.model';

describe('FilterPanelComponent', () => {
  let fixture: ComponentFixture<FilterPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterPanelComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FilterPanelComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should render collapsed pill by default', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-filter-pill]')).toBeTruthy();
    expect(el.querySelector('[data-filter-panel]')).toBeNull();
  });

  it('should expand when pill is clicked', async () => {
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLElement>('[data-filter-pill]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelector('[data-filter-panel]')).toBeTruthy();
  });

  it('should collapse when close button is clicked', async () => {
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLElement>('[data-filter-pill]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelector('[data-filter-panel]')).toBeTruthy();
    el.querySelector<HTMLElement>('[data-close-btn]')?.click();
    fixture.detectChanges();
    expect(el.querySelector('[data-filter-panel]')).toBeNull();
  });

  it('should emit filterChange when Apply is clicked', async () => {
    const emitted: FilterCriteria[] = [];
    fixture.componentInstance.filterChange.subscribe((f: FilterCriteria) => emitted.push(f));
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLElement>('[data-filter-pill]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    el.querySelector<HTMLElement>('[data-apply-btn]')?.click();
    fixture.detectChanges();
    expect(emitted.length).toBe(1);
  });

  it('should emit filterChange when Reset is clicked', async () => {
    const emitted: FilterCriteria[] = [];
    fixture.componentInstance.filterChange.subscribe((f: FilterCriteria) => emitted.push(f));
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLElement>('[data-filter-pill]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    el.querySelector<HTMLElement>('[data-reset-btn]')?.click();
    fixture.detectChanges();
    expect(emitted.length).toBe(1);
  });
});
