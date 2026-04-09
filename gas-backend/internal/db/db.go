// gas-backend/internal/db/db.go
package db

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
)

func Open(path string) (*sql.DB, error) {
	database, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}
	if err := migrate(database); err != nil {
		return nil, err
	}
	return database, nil
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS plumes (
			id                         TEXT PRIMARY KEY,
			satellite                  TEXT,
			payload                    TEXT,
			product_level              TEXT,
			overpass_time              TEXT,
			longitude                  REAL,
			latitude                   REAL,
			country                    TEXT,
			sector                     TEXT,
			gas_type                   TEXT,
			flux_rate                  REAL,
			flux_rate_std              REAL,
			wind_u                     REAL,
			wind_v                     REAL,
			wind_speed                 REAL,
			detection_institution      TEXT,
			quantification_institution TEXT,
			feedback_operator          TEXT,
			feedback_government        TEXT,
			additional_information     TEXT,
			shared_organization        TEXT,
			geometry                   TEXT,
			tiff_path                  TEXT
		);
		CREATE INDEX IF NOT EXISTS idx_gas_type      ON plumes(gas_type);
		CREATE INDEX IF NOT EXISTS idx_overpass_time ON plumes(overpass_time);
		CREATE INDEX IF NOT EXISTS idx_flux_rate     ON plumes(flux_rate);
	`)
	return err
}
