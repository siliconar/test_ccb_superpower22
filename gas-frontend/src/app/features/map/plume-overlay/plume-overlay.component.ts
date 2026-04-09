import {
  Component, input, effect, ChangeDetectionStrategy, OnDestroy, inject, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Plume } from '../../../core/models/plume.model';
import { GAS_COLORS } from '../../../core/models/plume.model';

const OVERLAY_SOURCE = 'plume-overlay';
const OUTLINE_LAYER = 'plume-outline';
const FILL_LAYER = 'plume-fill';
const HEATMAP_LAYER = 'plume-heatmap';

@Component({
  selector: 'app-plume-overlay',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlumeOverlayComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  readonly map = input<MapLibreMap | null>(null);
  readonly plume = input<Plume | null>(null);

  constructor() {
    effect(() => {
      const map = this.map();
      const plume = this.plume();
      if (!isPlatformBrowser(this.platformId) || !map) return;
      this.clearOverlay(map);
      if (plume) this.renderOverlay(map, plume);
    });
  }

  ngOnDestroy(): void {
    const map = this.map();
    if (map) this.clearOverlay(map);
  }

  private clearOverlay(map: MapLibreMap): void {
    if (map.getLayer(HEATMAP_LAYER)) map.removeLayer(HEATMAP_LAYER);
    if (map.getLayer(OUTLINE_LAYER)) map.removeLayer(OUTLINE_LAYER);
    if (map.getLayer(FILL_LAYER)) map.removeLayer(FILL_LAYER);
    if (map.getSource(OVERLAY_SOURCE)) map.removeSource(OVERLAY_SOURCE);
    if (map.getSource(`${OVERLAY_SOURCE}-tiff`)) map.removeSource(`${OVERLAY_SOURCE}-tiff`);
  }

  private renderOverlay(map: MapLibreMap, plume: Plume): void {
    const color = GAS_COLORS[plume.gasType] ?? '#94a3b8';

    map.addSource(OVERLAY_SOURCE, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: plume.geometry,
        properties: { id: plume.id, gasType: plume.gasType },
      },
    });

    // Transparent fill for hover area
    map.addLayer({
      id: FILL_LAYER,
      type: 'fill',
      source: OVERLAY_SOURCE,
      paint: { 'fill-color': color, 'fill-opacity': 0.08 },
    });

    // Dashed polygon outline
    map.addLayer({
      id: OUTLINE_LAYER,
      type: 'line',
      source: OVERLAY_SOURCE,
      paint: {
        'line-color': color,
        'line-width': 2,
        'line-dasharray': [4, 2],
      },
    });

    // TIFF heatmap (rendered to canvas, added as image source if available)
    if (plume.tiffUrl) {
      this.renderTiffHeatmap(map, plume).catch(err => {
        console.warn('TIFF heatmap failed, showing polygon only:', err);
      });
    }
  }

  private async renderTiffHeatmap(map: MapLibreMap, plume: Plume): Promise<void> {
    const { fromUrl } = await import('geotiff');
    const tiff = await fromUrl(plume.tiffUrl!);
    const image = await tiff.getImage();
    const rasters = await image.readRasters({ interleave: false }) as unknown as ArrayLike<number>[];
    const r = rasters[0];

    const width = image.getWidth();
    const height = image.getHeight();
    const bbox = image.getBoundingBox(); // [west, south, east, north]

    // Render pixel values to canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(width, height);

    // Normalize and colorize (orange gradient for CH4, red for CO, indigo for NO2)
    const colorMap: Record<string, [number, number, number]> = {
      CH4: [251, 146, 60],
      CO: [248, 113, 113],
      NO2: [129, 140, 248],
    };
    const [cr, cg, cb] = colorMap[plume.gasType] ?? [148, 163, 184];
    const values = Array.from(r as ArrayLike<number>);
    const max = Math.max(...values.filter(v => v > 0));

    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (v <= 0) { imgData.data[i * 4 + 3] = 0; continue; }
      const intensity = Math.min(v / max, 1);
      imgData.data[i * 4 + 0] = cr;
      imgData.data[i * 4 + 1] = cg;
      imgData.data[i * 4 + 2] = cb;
      imgData.data[i * 4 + 3] = Math.round(intensity * 180);
    }
    ctx.putImageData(imgData, 0, 0);

    map.addSource(`${OVERLAY_SOURCE}-tiff`, {
      type: 'image',
      url: canvas.toDataURL(),
      coordinates: [
        [bbox[0], bbox[3]], // NW
        [bbox[2], bbox[3]], // NE
        [bbox[2], bbox[1]], // SE
        [bbox[0], bbox[1]], // SW
      ],
    });

    map.addLayer({
      id: HEATMAP_LAYER,
      type: 'raster',
      source: `${OVERLAY_SOURCE}-tiff`,
      paint: { 'raster-opacity': 0.7, 'raster-fade-duration': 300 },
    });
  }
}
