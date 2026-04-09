// gas-backend/internal/model/plume.go
package model

type Plume struct {
	ID                        string  `json:"id"`
	Satellite                 string  `json:"satellite"`
	Payload                   string  `json:"payload"`
	ProductLevel              string  `json:"productLevel"`
	OverpassTime              string  `json:"overpassTime"`
	Longitude                 float64 `json:"longitude"`
	Latitude                  float64 `json:"latitude"`
	Country                   string  `json:"country"`
	Sector                    string  `json:"sector"`
	GasType                   string  `json:"gasType"`
	FluxRate                  float64 `json:"fluxRate"`
	FluxRateStd               float64 `json:"fluxRateStd"`
	WindU                     float64 `json:"windU"`
	WindV                     float64 `json:"windV"`
	WindSpeed                 float64 `json:"windSpeed"`
	DetectionInstitution      string  `json:"detectionInstitution"`
	QuantificationInstitution string  `json:"quantificationInstitution"`
	FeedbackOperator          string  `json:"feedbackOperator"`
	FeedbackGovernment        string  `json:"feedbackGovernment"`
	AdditionalInformation     string  `json:"additionalInformation"`
	SharedOrganization        string  `json:"sharedOrganization"`
	Geometry                  string  `json:"geometry"`
	TiffPath                  string  `json:"tiffPath"`
}

type Stats struct {
	TotalDetections     int    `json:"totalDetections"`
	CountriesCount      int    `json:"countriesCount"`
	GasTypesCount       int    `json:"gasTypesCount"`
	LatestDetectionDate string `json:"latestDetectionDate"`
}

type FilterCriteria struct {
	GasTypes  []string
	DateFrom  string
	DateTo    string
	FluxMin   *float64
	FluxMax   *float64
	Satellite string
	Sector    string
}
