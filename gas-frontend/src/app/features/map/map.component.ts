import {
  Component, OnInit, OnDestroy, inject, signal,
  ChangeDetectionStrategy, afterNextRender
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, Subject, takeUntil } from 'rxjs';
import maplibregl, { Map as MapLibreMap, MapMouseEvent, GeoJSONSource } from 'maplibre-gl';
import { PlumeService } from '../../core/services/plume.service';
import { Plume, GAS_COLORS, DEFAULT_FILTER, FilterCriteria } from '../../core/models/plume.model';
import { FilterPanelComponent } from './filter-panel/filter-panel.component';
import { DetailDrawerComponent } from './detail-drawer/detail-drawer.component';

const MBTILES_TILEJSON = 'http://localhost:7777/services/vector/tilejson.json';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [RouterLink, FilterPanelComponent, DetailDrawerComponent],
  templateUrl: './map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; position: absolute; inset: 0; }
    #map-container { position: absolute; inset: 0; top: 48px; }
    nav { position: relative; z-index: 10; height: 48px; }
  `],
})
export class MapComponent implements OnInit, OnDestroy {
  private service = inject(PlumeService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  private map?: MapLibreMap;
  private pendingPlumes: Plume[] | null = null;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly selectedPlume = signal<Plume | null>(null);
  readonly mapInstance = signal<MapLibreMap | null>(null);

  private allPlumes = signal<Plume[]>([]);

  constructor() {
    afterNextRender(() => this.initMap());
  }

  ngOnInit(): void {
    this.service.getPlumes(DEFAULT_FILTER).pipe(
      takeUntil(this.destroy$),
      catchError(() => {
        this.error.set('Failed to load data');
        return of([]);
      })
    ).subscribe(plumes => {
      this.allPlumes.set(plumes);
      this.loading.set(false);
      this.updateMapSource(plumes);
    });

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.service.getPlumeById(id).pipe(
          takeUntil(this.destroy$),
          catchError(() => of(null))
        ).subscribe(plume => {
          if (plume) {
            this.selectedPlume.set(plume);
            this.map?.flyTo({ center: [plume.longitude, plume.latitude], zoom: 12 });
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.map?.remove();
  }

  private initMap(): void {
    const container = document.getElementById('map-container');
    if (!container) return;

    this.map = new maplibregl.Map({
      container: 'map-container',
      style: {
        version: 8,
        sources: {
          basemap: { type: 'vector', url: MBTILES_TILEJSON },
        },
        layers: this.buildBasemapLayers(),
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      },
      center: [0, 20],
      zoom: 2,
    });

    this.map.on('load', () => {
      this.addPlumeSource();
      if (this.pendingPlumes !== null) {
        this.updateMapSource(this.pendingPlumes);
        this.pendingPlumes = null;
      }
      this.addClusterLayers();
      this.addMarkerLayers();
      this.addMapEventHandlers();
      this.mapInstance.set(this.map!);
    });
  }

  private buildBasemapLayers(): maplibregl.LayerSpecification[] {
    return [
      { id: 'background', type: 'background', paint: { 'background-color': '#0f172a' } },
      { id: 'land', type: 'fill', source: 'basemap', 'source-layer': 'land', paint: { 'fill-color': '#1e293b' } },
      { id: 'water', type: 'fill', source: 'basemap', 'source-layer': 'water', paint: { 'fill-color': '#0f172a' } },
      { id: 'boundaries', type: 'line', source: 'basemap', 'source-layer': 'boundaries', paint: { 'line-color': '#334155', 'line-width': 0.5 } },
      { id: 'roads', type: 'line', source: 'basemap', 'source-layer': 'roads', paint: { 'line-color': '#1e3a5f', 'line-width': 0.5 } },
    ];
  }

  private addPlumeSource(): void {
    this.map?.addSource('plumes', {
      type: 'geojson',
      data: this.plumesToGeoJSON([]),
      cluster: true,
      clusterMaxZoom: 10,
      clusterRadius: 50,
    });
  }

  private addClusterLayers(): void {
    if (!this.map) return;
    this.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'plumes',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#fb923c', 5, '#f87171', 20, '#818cf8'],
        'circle-radius': ['step', ['get', 'point_count'], 18, 5, 25, 20, 35],
        'circle-opacity': 0.85,
      },
    });
    this.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'plumes',
      filter: ['has', 'point_count'],
      layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12 },
      paint: { 'text-color': '#ffffff' },
    });
  }

  private addMarkerLayers(): void {
    if (!this.map) return;
    const colorExpr: maplibregl.ExpressionSpecification = [
      'match', ['get', 'gasType'],
      'CH4', GAS_COLORS.CH4,
      'CO', GAS_COLORS.CO,
      'NO2', GAS_COLORS.NO2,
      '#94a3b8',
    ];
    this.map.addLayer({
      id: 'markers-glow',
      type: 'circle',
      source: 'plumes',
      filter: ['!', ['has', 'point_count']],
      paint: { 'circle-radius': 16, 'circle-color': colorExpr, 'circle-opacity': 0.2 },
    });
    this.map.addLayer({
      id: 'markers',
      type: 'circle',
      source: 'plumes',
      filter: ['!', ['has', 'point_count']],
      paint: { 'circle-radius': 7, 'circle-color': colorExpr, 'circle-stroke-width': 1.5, 'circle-stroke-color': '#0f172a' },
    });
  }

  private addMapEventHandlers(): void {
    if (!this.map) return;
    this.map.on('click', 'clusters', (e: MapMouseEvent) => {
      const features = this.map!.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      if (!features.length) return;
      const clusterId = features[0].properties?.['cluster_id'];
      (this.map!.getSource('plumes') as GeoJSONSource).getClusterExpansionZoom(clusterId).then((zoom: number) => {
        if (zoom == null) return;
        this.map!.flyTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom });
      }).catch(() => {});
    });
    this.map.on('click', 'markers', (e: MapMouseEvent) => {
      const features = this.map!.queryRenderedFeatures(e.point, { layers: ['markers'] });
      if (!features.length) return;
      const plumeId = features[0].properties?.['id'];
      const plume = this.allPlumes().find(p => p.id === plumeId);
      if (plume) this.selectedPlume.set(plume);
    });
    this.map.on('mouseenter', 'clusters', () => { if (this.map) this.map.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', 'clusters', () => { if (this.map) this.map.getCanvas().style.cursor = ''; });
    this.map.on('mouseenter', 'markers', () => { if (this.map) this.map.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', 'markers', () => { if (this.map) this.map.getCanvas().style.cursor = ''; });
  }

  private updateMapSource(plumes: Plume[]): void {
    const source = this.map?.getSource('plumes') as GeoJSONSource | undefined;
    if (source) {
      source.setData(this.plumesToGeoJSON(plumes));
    } else {
      // Map source not ready yet — buffer and apply when map loads
      this.pendingPlumes = plumes;
    }
  }

  private plumesToGeoJSON(plumes: Plume[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: plumes.map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
        properties: { id: p.id, gasType: p.gasType, fluxRate: p.fluxRate, country: p.country },
      })),
    };
  }

  onFilterChange(newFilter: FilterCriteria): void {
    this.loading.set(true);
    this.service.getPlumes(newFilter).pipe(
      takeUntil(this.destroy$),
      catchError(() => {
        this.error.set('Failed to load data');
        return of([]);
      })
    ).subscribe(plumes => {
      this.allPlumes.set(plumes);
      this.loading.set(false);
      this.updateMapSource(plumes);
    });
  }

  closeDrawer(): void {
    this.selectedPlume.set(null);
  }

  dismissError(): void {
    this.error.set(null);
  }
}
