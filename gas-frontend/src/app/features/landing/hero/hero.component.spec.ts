import { TestBed } from '@angular/core/testing';
import { HeroComponent } from './hero.component';
import { provideRouter } from '@angular/router';

describe('HeroComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render headline containing "Track the Invisible"', () => {
    const fixture = TestBed.createComponent(HeroComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Track the Invisible');
  });

  it('should have Open Map link inside the hero section', () => {
    const fixture = TestBed.createComponent(HeroComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const links = Array.from(el.querySelectorAll('a'));
    const mapLink = links.find(l => l.getAttribute('href') === '/map' || l.getAttribute('ng-reflect-router-link') === '/map');
    expect(mapLink).toBeTruthy();
  });
});
