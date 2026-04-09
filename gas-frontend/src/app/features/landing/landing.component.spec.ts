// src/app/features/landing/landing.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { LandingComponent } from './landing.component';
import { provideRouter } from '@angular/router';
import { PlumeService } from '../../core/services/plume.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockPlumeService } from '../../core/services/mock-plume.service';

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PlumeService, useClass: MockPlumeService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LandingComponent);
  });

  it('should render nav bar with GasWatch logo and CTA', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const nav = el.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav!.textContent).toContain('GasWatch');
    const ctaLink = nav!.querySelector('a[href="/map"]') ?? nav!.querySelector('a[ng-reflect-router-link="/map"]');
    expect(ctaLink).toBeTruthy();
  });

  it('should render footer', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('footer')).toBeTruthy();
    expect(el.textContent).toContain(new Date().getFullYear().toString());
  });
});
