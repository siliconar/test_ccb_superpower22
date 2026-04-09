// src/app/features/landing/landing.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroComponent } from './hero/hero.component';
import { StatsBarComponent } from './stats-bar/stats-bar.component';
import { GasTypesComponent } from './gas-types/gas-types.component';
import { LatestDetectionsComponent } from './latest-detections/latest-detections.component';
import { AboutComponent } from './about/about.component';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, HeroComponent, StatsBarComponent, GasTypesComponent, LatestDetectionsComponent, AboutComponent],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  readonly currentYear = new Date().getFullYear();
}
