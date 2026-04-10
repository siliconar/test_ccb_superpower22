package repository_test

import (
	"testing"

	"gaswatch/backend/internal/db"
	"gaswatch/backend/internal/model"
	"gaswatch/backend/internal/repository"
)

func setupTestDB(t *testing.T) *repository.PlumeRepo {
	t.Helper()
	database, err := db.Open(":memory:")
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	t.Cleanup(func() { database.Close() })
	return repository.NewPlumeRepo(database)
}

func samplePlume() model.Plume {
	return model.Plume{
		ID:           "A0000092",
		Satellite:    "GAOFEN-5-01A",
		GasType:      "CH4",
		FluxRate:     1423.84,
		Country:      "United States of America",
		Sector:       "Oil and Gas",
		OverpassTime: "2023-03-19T20:05:43",
		Longitude:    -103.585,
		Latitude:     31.299,
		Geometry:     []byte(`{"type":"Polygon","coordinates":[[[0,0]]]}`),
		TiffPath:     "data/rawdata/A0000092/A0000092_PLUME.tif",
	}
}

func TestInsertAndGetByID(t *testing.T) {
	repo := setupTestDB(t)
	p := samplePlume()

	if err := repo.Insert(p); err != nil {
		t.Fatalf("Insert failed: %v", err)
	}

	got, err := repo.GetByID("A0000092")
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got.ID != "A0000092" {
		t.Errorf("expected ID A0000092, got %s", got.ID)
	}
	if got.GasType != "CH4" {
		t.Errorf("expected GasType CH4, got %s", got.GasType)
	}
}

func TestInsertIdempotent(t *testing.T) {
	repo := setupTestDB(t)
	p := samplePlume()

	if err := repo.Insert(p); err != nil {
		t.Fatalf("first Insert failed: %v", err)
	}
	p.FluxRate = 999.0
	if err := repo.Insert(p); err != nil {
		t.Fatalf("second Insert failed: %v", err)
	}

	got, _ := repo.GetByID("A0000092")
	if got.FluxRate != 999.0 {
		t.Errorf("expected FluxRate 999.0 after replace, got %f", got.FluxRate)
	}
}

func TestListNoFilter(t *testing.T) {
	repo := setupTestDB(t)
	if err := repo.Insert(samplePlume()); err != nil {
		t.Fatal(err)
	}

	plumes, total, err := repo.List(model.FilterCriteria{})
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if total != 1 {
		t.Errorf("expected total 1, got %d", total)
	}
	if len(plumes) != 1 {
		t.Errorf("expected 1 plume, got %d", len(plumes))
	}
}

func TestListFilterByGasType(t *testing.T) {
	repo := setupTestDB(t)
	repo.Insert(samplePlume())

	plumes, total, err := repo.List(model.FilterCriteria{GasTypes: []string{"CO"}})
	if err != nil {
		t.Fatal(err)
	}
	if total != 0 {
		t.Errorf("expected 0 results for CO filter, got %d", total)
	}
	_ = plumes
}

func TestGetStats(t *testing.T) {
	repo := setupTestDB(t)
	repo.Insert(samplePlume())

	stats, err := repo.GetStats()
	if err != nil {
		t.Fatalf("GetStats failed: %v", err)
	}
	if stats.TotalDetections != 1 {
		t.Errorf("expected TotalDetections 1, got %d", stats.TotalDetections)
	}
	if stats.CountriesCount != 1 {
		t.Errorf("expected CountriesCount 1, got %d", stats.CountriesCount)
	}
	if stats.GasTypesCount != 1 {
		t.Errorf("expected GasTypesCount 1, got %d", stats.GasTypesCount)
	}
}
