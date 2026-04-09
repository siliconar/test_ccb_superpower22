import { Component } from '@angular/core';

interface GasCard {
  type: 'CH4' | 'CO' | 'NO2';
  name: string;
  formula: string;
  colorClass: string;
  borderClass: string;
  description: string;
  sources: string;
}

@Component({
  selector: 'app-gas-types',
  standalone: true,
  templateUrl: './gas-types.component.html',
})
export class GasTypesComponent {
  readonly gases: GasCard[] = [
    {
      type: 'CH4',
      name: 'Methane',
      formula: 'CH₄',
      colorClass: 'text-orange-400',
      borderClass: 'border-orange-400/30',
      description: 'A potent greenhouse gas with 80× the warming power of CO₂ over 20 years. Primary anthropogenic sources include oil & gas operations and agriculture.',
      sources: 'Oil & Gas · Agriculture · Landfills',
    },
    {
      type: 'CO',
      name: 'Carbon Monoxide',
      formula: 'CO',
      colorClass: 'text-red-400',
      borderClass: 'border-red-400/30',
      description: 'An indirect greenhouse gas and air pollutant produced by incomplete combustion. Indicator of industrial activity and biomass burning.',
      sources: 'Combustion · Biomass Burning · Industry',
    },
    {
      type: 'NO2',
      name: 'Nitrogen Dioxide',
      formula: 'NO₂',
      colorClass: 'text-indigo-400',
      borderClass: 'border-indigo-400/30',
      description: 'A toxic air pollutant linked to respiratory disease and a precursor to smog. Primarily emitted from vehicle exhausts and power plants.',
      sources: 'Transport · Power Plants · Industry',
    },
  ];
}
