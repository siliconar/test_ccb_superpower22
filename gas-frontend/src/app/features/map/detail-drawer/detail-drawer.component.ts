import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { Plume, GAS_COLORS } from '../../../core/models/plume.model';

interface DetailField {
  label: string;
  value: string;
}

@Component({
  selector: 'app-detail-drawer',
  standalone: true,
  templateUrl: './detail-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .drawer-slide { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  `],
})
export class DetailDrawerComponent {
  readonly plume = input<Plume | null>(null);
  readonly close = output<void>();

  readonly fields = computed<DetailField[]>(() => {
    const p = this.plume();
    if (!p) return [];
    return [
      { label: 'ID', value: p.id },
      { label: 'Satellite', value: p.satellite },
      { label: 'Payload', value: p.payload },
      { label: 'Product Level', value: p.productLevel },
      { label: 'Overpass Time', value: new Date(p.overpassTime).toLocaleString() },
      { label: 'Country', value: p.country },
      { label: 'Sector', value: p.sector },
      { label: 'Longitude', value: p.longitude.toFixed(6) },
      { label: 'Latitude', value: p.latitude.toFixed(6) },
      { label: 'Flux Rate', value: `${p.fluxRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg/h` },
      { label: 'Flux Std Dev', value: `${p.fluxRateStd.toFixed(2)} kg/h` },
      { label: 'Wind Speed', value: `${p.windSpeed.toFixed(2)} m/s` },
      { label: 'Wind U', value: `${p.windU} m/s` },
      { label: 'Wind V', value: `${p.windV} m/s` },
      { label: 'Detection Institution', value: p.detectionInstitution },
      { label: 'Quantification Institution', value: p.quantificationInstitution },
    ].filter(f => f.value.trim() !== '');
  });

  gasColor(gasType: string): string {
    return GAS_COLORS[gasType as keyof typeof GAS_COLORS] ?? '#94a3b8';
  }
}
