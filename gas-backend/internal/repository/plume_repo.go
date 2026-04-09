package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"gaswatch/backend/internal/model"
)

type PlumeRepo struct {
	db *sql.DB
}

func NewPlumeRepo(db *sql.DB) *PlumeRepo {
	return &PlumeRepo{db: db}
}

func (r *PlumeRepo) Insert(p model.Plume) error {
	_, err := r.db.Exec(`
		INSERT OR REPLACE INTO plumes (
			id, satellite, payload, product_level, overpass_time,
			longitude, latitude, country, sector, gas_type,
			flux_rate, flux_rate_std, wind_u, wind_v, wind_speed,
			detection_institution, quantification_institution,
			feedback_operator, feedback_government, additional_information,
			shared_organization, geometry, tiff_path
		) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		p.ID, p.Satellite, p.Payload, p.ProductLevel, p.OverpassTime,
		p.Longitude, p.Latitude, p.Country, p.Sector, p.GasType,
		p.FluxRate, p.FluxRateStd, p.WindU, p.WindV, p.WindSpeed,
		p.DetectionInstitution, p.QuantificationInstitution,
		p.FeedbackOperator, p.FeedbackGovernment, p.AdditionalInformation,
		p.SharedOrganization, p.Geometry, p.TiffPath,
	)
	return err
}

func (r *PlumeRepo) GetByID(id string) (*model.Plume, error) {
	row := r.db.QueryRow(`SELECT
		id, satellite, payload, product_level, overpass_time,
		longitude, latitude, country, sector, gas_type,
		flux_rate, flux_rate_std, wind_u, wind_v, wind_speed,
		detection_institution, quantification_institution,
		feedback_operator, feedback_government, additional_information,
		shared_organization, geometry, tiff_path
		FROM plumes WHERE id = ?`, id)
	return scanPlume(row)
}

func (r *PlumeRepo) List(f model.FilterCriteria) ([]model.Plume, int, error) {
	where, args := buildWhere(f)
	query := "SELECT id, satellite, payload, product_level, overpass_time, longitude, latitude, country, sector, gas_type, flux_rate, flux_rate_std, wind_u, wind_v, wind_speed, detection_institution, quantification_institution, feedback_operator, feedback_government, additional_information, shared_organization, geometry, tiff_path FROM plumes" + where

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var plumes []model.Plume
	for rows.Next() {
		p, err := scanPlumeRow(rows)
		if err != nil {
			return nil, 0, err
		}
		plumes = append(plumes, *p)
	}

	return plumes, len(plumes), nil
}

func (r *PlumeRepo) GetStats() (*model.Stats, error) {
	var s model.Stats
	err := r.db.QueryRow(`
		SELECT
			COUNT(*),
			COUNT(DISTINCT country),
			COUNT(DISTINCT gas_type),
			COALESCE(MAX(overpass_time), '')
		FROM plumes
	`).Scan(&s.TotalDetections, &s.CountriesCount, &s.GasTypesCount, &s.LatestDetectionDate)
	return &s, err
}

func buildWhere(f model.FilterCriteria) (string, []any) {
	var clauses []string
	var args []any

	if len(f.GasTypes) > 0 {
		placeholders := strings.Repeat("?,", len(f.GasTypes))
		placeholders = placeholders[:len(placeholders)-1]
		clauses = append(clauses, fmt.Sprintf("gas_type IN (%s)", placeholders))
		for _, g := range f.GasTypes {
			args = append(args, g)
		}
	}
	if f.DateFrom != "" {
		clauses = append(clauses, "overpass_time >= ?")
		args = append(args, f.DateFrom)
	}
	if f.DateTo != "" {
		clauses = append(clauses, "overpass_time <= ?")
		args = append(args, f.DateTo)
	}
	if f.FluxMin != nil {
		clauses = append(clauses, "flux_rate >= ?")
		args = append(args, *f.FluxMin)
	}
	if f.FluxMax != nil {
		clauses = append(clauses, "flux_rate <= ?")
		args = append(args, *f.FluxMax)
	}
	if f.Satellite != "" {
		clauses = append(clauses, "satellite = ?")
		args = append(args, f.Satellite)
	}
	if f.Sector != "" {
		clauses = append(clauses, "sector = ?")
		args = append(args, f.Sector)
	}

	if len(clauses) == 0 {
		return "", args
	}
	return " WHERE " + strings.Join(clauses, " AND "), args
}

type scanner interface {
	Scan(dest ...any) error
}

func scanPlume(s scanner) (*model.Plume, error) {
	var p model.Plume
	err := s.Scan(
		&p.ID, &p.Satellite, &p.Payload, &p.ProductLevel, &p.OverpassTime,
		&p.Longitude, &p.Latitude, &p.Country, &p.Sector, &p.GasType,
		&p.FluxRate, &p.FluxRateStd, &p.WindU, &p.WindV, &p.WindSpeed,
		&p.DetectionInstitution, &p.QuantificationInstitution,
		&p.FeedbackOperator, &p.FeedbackGovernment, &p.AdditionalInformation,
		&p.SharedOrganization, &p.Geometry, &p.TiffPath,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func scanPlumeRow(rows *sql.Rows) (*model.Plume, error) {
	var p model.Plume
	err := rows.Scan(
		&p.ID, &p.Satellite, &p.Payload, &p.ProductLevel, &p.OverpassTime,
		&p.Longitude, &p.Latitude, &p.Country, &p.Sector, &p.GasType,
		&p.FluxRate, &p.FluxRateStd, &p.WindU, &p.WindV, &p.WindSpeed,
		&p.DetectionInstitution, &p.QuantificationInstitution,
		&p.FeedbackOperator, &p.FeedbackGovernment, &p.AdditionalInformation,
		&p.SharedOrganization, &p.Geometry, &p.TiffPath,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}
