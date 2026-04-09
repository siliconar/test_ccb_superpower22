import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PlumeService } from '../../../core/services/plume.service';
import { Stats } from '../../../core/models/plume.model';

interface StatItem {
  label: string;
  value: string;
  description: string;
}

@Component({
  standalone: true,
  selector: 'app-stats-bar',
  templateUrl: './stats-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsBarComponent implements OnInit, OnDestroy {
  private service = inject(PlumeService);
  private el = inject(ElementRef);
  private observer?: IntersectionObserver;

  readonly animated = signal(false);
  private readonly rawStats = toSignal(this.service.getStats());

  get stats(): Stats | undefined {
    return this.rawStats();
  }

  readonly statItems = (): StatItem[] => {
    const s = this.stats;
    if (!s) return [];
    return [
      {
        label: 'Total Detections',
        value: s.totalDetections.toLocaleString(),
        description: 'Satellite plume detections',
      },
      {
        label: 'Countries Monitored',
        value: s.countriesCount.toString(),
        description: 'Nations with recorded events',
      },
      {
        label: 'Gas Types',
        value: s.gasTypesCount.toString(),
        description: 'CH₄, CO, NO₂',
      },
      {
        label: 'Latest Detection',
        value: new Date(s.latestDetectionDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        description: 'Most recent satellite pass',
      },
    ];
  };

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          this.animated.set(true);
          this.observer?.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
