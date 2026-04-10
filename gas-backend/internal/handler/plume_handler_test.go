package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"gaswatch/backend/internal/db"
	"gaswatch/backend/internal/handler"
	"gaswatch/backend/internal/model"
	"gaswatch/backend/internal/repository"
)

func setupRouter(t *testing.T) (*gin.Engine, *repository.PlumeRepo) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	database, err := db.Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { database.Close() })
	repo := repository.NewPlumeRepo(database)
	r := gin.New()
	handler.Register(r, repo)
	return r, repo
}

func insertSample(t *testing.T, repo *repository.PlumeRepo) {
	t.Helper()
	err := repo.Insert(model.Plume{
		ID:           "A0000092",
		Satellite:    "GAOFEN-5-01A",
		GasType:      "CH4",
		FluxRate:     1423.84,
		Country:      "United States of America",
		Sector:       "Oil and Gas",
		OverpassTime: "2023-03-19T20:05:43",
		Longitude:    -103.585,
		Latitude:     31.299,
		Geometry:     []byte(`{"type":"Polygon","coordinates":[]}`),
		TiffPath:     "testdata/test.tif",
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestGetPlumes(t *testing.T) {
	r, repo := setupRouter(t)
	insertSample(t, repo)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/plumes", nil)
	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["total"].(float64) != 1 {
		t.Errorf("expected total 1, got %v", resp["total"])
	}
	data := resp["data"].([]any)
	first := data[0].(map[string]any)
	if _, ok := first["tiffPath"]; ok {
		t.Errorf("did not expect tiffPath in response")
	}
	if first["tiffUrl"] != "/api/plumes/A0000092/tiff" {
		t.Errorf("expected tiffUrl /api/plumes/A0000092/tiff, got %v", first["tiffUrl"])
	}
	if _, ok := first["geometry"].(map[string]any); !ok {
		t.Errorf("expected geometry to be object, got %T", first["geometry"])
	}
}

func TestGetPlumeByID(t *testing.T) {
	r, repo := setupRouter(t)
	insertSample(t, repo)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/plumes/A0000092", nil)
	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var p model.Plume
	json.Unmarshal(w.Body.Bytes(), &p)
	if p.ID != "A0000092" {
		t.Errorf("expected ID A0000092, got %s", p.ID)
	}
	if p.TiffURL != "/api/plumes/A0000092/tiff" {
		t.Errorf("expected tiffUrl /api/plumes/A0000092/tiff, got %s", p.TiffURL)
	}

	var raw map[string]any
	json.Unmarshal(w.Body.Bytes(), &raw)
	if _, ok := raw["tiffPath"]; ok {
		t.Errorf("did not expect tiffPath in response")
	}
}

func TestGetPlumeByIDNotFound(t *testing.T) {
	r, _ := setupRouter(t)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/plumes/NOTEXIST", nil)
	r.ServeHTTP(w, req)

	if w.Code != 404 {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestGetStats(t *testing.T) {
	r, repo := setupRouter(t)
	insertSample(t, repo)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/stats", nil)
	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var s model.Stats
	json.Unmarshal(w.Body.Bytes(), &s)
	if s.TotalDetections != 1 {
		t.Errorf("expected TotalDetections 1, got %d", s.TotalDetections)
	}
}

func TestGetTiff(t *testing.T) {
	dir := t.TempDir()
	tifPath := filepath.Join(dir, "test.tif")
	os.WriteFile(tifPath, []byte("FAKE_TIFF_DATA"), 0644)

	r, repo := setupRouter(t)
	repo.Insert(model.Plume{
		ID:       "TIFFTEST",
		GasType:  "CH4",
		TiffPath: tifPath,
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/plumes/TIFFTEST/tiff", nil)
	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	if w.Body.String() != "FAKE_TIFF_DATA" {
		t.Errorf("unexpected body: %s", w.Body.String())
	}
}
