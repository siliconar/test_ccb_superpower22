import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  templateUrl: './hero.component.html',
  styles: [`
    .particle {
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      opacity: 0;
      animation: float-particle linear infinite;
    }
    @keyframes float-particle {
      0% { opacity: 0; transform: translateY(20px); }
      20% { opacity: 0.5; }
      80% { opacity: 0.2; }
      100% { opacity: 0; transform: translateY(-80px); }
    }
  `],
})
export class HeroComponent {
  readonly particles = Array.from({ length: 40 }, (_, i) => ({
    left: `${(i * 2.5 + 1) % 100}%`,
    top: `${(i * 7.3 + 5) % 100}%`,
    delay: `${(i * 0.3) % 8}s`,
    duration: `${6 + (i % 5)}s`,
    color: i % 3 === 0 ? '#fb923c' : i % 3 === 1 ? '#818cf8' : '#f87171',
  }));
}
