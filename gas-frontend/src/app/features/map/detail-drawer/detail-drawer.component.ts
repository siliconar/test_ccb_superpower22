import { Component, input, output } from '@angular/core';
import { Plume } from '../../../core/models/plume.model';

@Component({
  selector: 'app-detail-drawer',
  standalone: true,
  template: '<div id="detail-drawer"></div>',
})
export class DetailDrawerComponent {
  readonly plume = input<Plume | null>(null);
  readonly close = output<void>();
}
