import { Component, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterCriteria, GasType, DEFAULT_FILTER } from '../../../core/models/plume.model';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanelComponent {
  readonly filterChange = output<FilterCriteria>();

  readonly expanded = signal(false);
  readonly selectedGasTypes = signal<Set<GasType>>(new Set());
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly fluxMin = signal(0);

  readonly GAS_TYPES: GasType[] = ['CH4', 'CO', 'NO2'];

  get activeCount(): number {
    let count = 0;
    if (this.selectedGasTypes().size) count++;
    if (this.dateFrom() || this.dateTo()) count++;
    if (this.fluxMin() > 0) count++;
    return count;
  }

  toggleExpanded(): void { this.expanded.update(v => !v); }

  toggleGasType(type: GasType): void {
    const set = new Set(this.selectedGasTypes());
    set.has(type) ? set.delete(type) : set.add(type);
    this.selectedGasTypes.set(set);
  }

  private static readonly FLUX_MAX = 10000;

  applyFilter(): void {
    this.filterChange.emit({
      ...DEFAULT_FILTER,
      gasTypes: [...this.selectedGasTypes()],
      dateRange: { start: this.dateFrom(), end: this.dateTo() },
      fluxRateRange: { min: this.fluxMin(), max: FilterPanelComponent.FLUX_MAX },
    });
    this.expanded.set(false);
  }

  protected onInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected onInputNumber(event: Event): number {
    return +(event.target as HTMLInputElement).value;
  }

  resetFilter(): void {
    this.selectedGasTypes.set(new Set());
    this.dateFrom.set('');
    this.dateTo.set('');
    this.fluxMin.set(0);
    this.filterChange.emit({ ...DEFAULT_FILTER });
    this.expanded.set(false);
  }
}
