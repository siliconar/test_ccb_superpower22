import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { RouterLink } from '@angular/router';
import { PlumeService } from '../../../core/services/plume.service';
import { GAS_COLORS, DEFAULT_FILTER } from '../../../core/models/plume.model';

@Component({
  selector: 'app-latest-detections',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './latest-detections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestDetectionsComponent {
  private service = inject(PlumeService);

  readonly plumes = toSignal(
    this.service.getPlumes(DEFAULT_FILTER).pipe(
      map(list =>
        [...list]
          .sort((a, b) => new Date(b.overpassTime).getTime() - new Date(a.overpassTime).getTime())
          .slice(0, 10)
      )
    )
  );

  gasColor(gasType: string): string {
    return GAS_COLORS[gasType as keyof typeof GAS_COLORS] ?? '#94a3b8';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  formatFlux(flux: number): string {
    return flux >= 1000 ? `${(flux / 1000).toFixed(1)}t/h` : `${Math.round(flux)} kg/h`;
  }
}
