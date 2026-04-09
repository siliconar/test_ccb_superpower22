import { Component, output } from '@angular/core';
import { FilterCriteria, DEFAULT_FILTER } from '../../../core/models/plume.model';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  template: '<div id="filter-panel"></div>',
})
export class FilterPanelComponent {
  readonly filterChange = output<FilterCriteria>();
}
