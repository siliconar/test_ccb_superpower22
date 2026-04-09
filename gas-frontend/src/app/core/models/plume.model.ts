/// <reference types="geojson" />

export type GasType = 'CH4' | 'CO' | 'NO2';

export interface Plume {
  id: string;
  satellite: string;
  payload: string;
  productLevel: string;
  overpassTime: string;
  longitude: number;
  latitude: number;
  country: string;
  sector: string;
  gasType: GasType;
  fluxRate: number;
  fluxRateStd: number;
  windU: number;
  windV: number;
  windSpeed: number;
  detectionInstitution: string;
  quantificationInstitution: string;
  feedbackOperator: string;
  feedbackGovernment: string;
  additionalInformation: string;
  sharedOrganization: string;
  geometry: GeoJSON.Polygon;
  tiffUrl?: string;
}

export interface FilterCriteria {
  gasTypes: GasType[];
  satellites: string[];
  dateRange: { start: string; end: string };
  sectors: string[];
  fluxRateRange: { min: number; max: number };
}

export interface Stats {
  totalDetections: number;
  countriesCount: number;
  gasTypesCount: number;
  latestDetectionDate: string;
}

export const GAS_COLORS: Record<GasType, string> = {
  CH4: '#fb923c',
  CO: '#f87171',
  NO2: '#818cf8',
};

export const DEFAULT_FILTER: FilterCriteria = {
  gasTypes: [],
  satellites: [],
  dateRange: { start: '', end: '' },
  sectors: [],
  fluxRateRange: { min: 0, max: 100000 },
};
