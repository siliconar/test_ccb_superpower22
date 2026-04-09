# GasWatch Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Go REST API (Gin + SQLite) that serves plume data imported from rawdata directories, replacing the frontend mock.

**Architecture:** Three-layer design — `db` (connection/schema), `repository` (SQLite CRUD), `handler` (Gin HTTP). A separate `cmd/import` CLI parses `_META.json` + `_PLUME.tif` directories into SQLite. The frontend switches to real API by toggling `useMock: false`.

**Tech Stack:** Go 1.26, Gin, mattn/go-sqlite3, gin-contrib/cors, encoding/json, standard `database/sql`

---

## File Map

| File | Responsibility |
|------|---------------|
| `gas-backend/go.mod` | Module definition + dependencies |
| `gas-backend/internal/db/db.go` | Open SQLite connection, run schema migration |
| `gas-backend/internal/model/plume.go` | `Plume` struct (JSON tags for API, mapped from DB) |
| `gas-backend/internal/repository/plume_repo.go` | `Insert`, `List` (with filters), `GetByID`, `GetStats` |
| `gas-backend/internal/repository/plume_repo_test.go` | Repository tests using `:memory:` SQLite |
| `gas-backend/internal/handler/plume_handler.go` | Gin handlers for all 4 endpoints |
| `gas-backend/internal/handler/plume_handler_test.go` | Handler tests using `httptest` |
| `gas-backend/cmd/import/main.go` | CLI: parse rawdata dir(s) → insert into DB |
| `gas-backend/cmd/server/main.go` | Gin server entry point |

---

## Task 1: Initialize Go Module

**Files:**
- Create: `gas-backend/go.mod`

- [ ] **Step 1: Initialize module**

```bash
cd gas-backend
go mod init gaswatch/backend
```

- [ ] **Step 2: Add dependencies**

```bash
go get github.com/gin-gonic/gin@latest
go get github.com/gin-contrib/cors@latest
go get github.com/mattn/go-sqlite3@latest
```

- [ ] **Step 3: Verify go.mod exists and has correct content**

```bash
cat go.mod
```

Expected: module line `module gaswatch/backend`, go version line, and require block with gin, cors, go-sqlite3.

- [ ] **Step 4: Commit**

```bash
cd ..
git add gas-backend/go.mod gas-backend/go.sum
git commit -m "chore: 初始化 Go 模块及依赖"
```

---

## Task 2: Database Layer

**Files:**
- Create: `gas-backend/internal/db/db.go`

- [ ] **Step 1: Create db.go**

```go
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd gas-backend
go build ./internal/db/...
```

Expected: no output (success).

- [ ] **Step 3: Commit**

```bash
cd ..
git add gas-backend/internal/db/db.go
git commit -m "feat: 数据库连接层及 schema 初始化"
```

---

## Task 3: Data Model

**Files:**
- Create: `gas-backend/internal/model/plume.go`

- [ ] **Step 1: Create model**

```go
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd gas-backend
go build ./internal/model/...
```

Expected: no output (success).

- [ ] **Step 3: Commit**

```bash
cd ..
git add gas-backend/internal/model/plume.go
git commit -m "feat: 数据模型定义（Plume, Stats, FilterCriteria）"
```

---

## Task 4: Repository Layer (TDD)

**Files:**
- Create: `gas-backend/internal/repository/plume_repo.go`
- Create: `gas-backend/internal/repository/plume_repo_test.go`

- [ ] **Step 1: Write failing tests first**

```go
// gas-backend/internal/repository/plume_repo_test.go
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
		Geometry:     `{"type":"Polygon","coordinates":[[[0,0]]]}`,
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
```

- [ ] **Step 2: Run tests — expect compile failure**

```bash
cd gas-backend
go test ./internal/repository/...
```

Expected: compile error — `repository` package does not exist yet.

- [ ] **Step 3: Implement repository**

```go
// gas-backend/internal/repository/plume_repo.go
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

	var total int
	r.db.QueryRow("SELECT COUNT(*) FROM plumes"+where, args...).Scan(&total)
	return plumes, total, nil
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd gas-backend
go test ./internal/repository/... -v
```

Expected output:
```
--- PASS: TestInsertAndGetByID
--- PASS: TestInsertIdempotent
--- PASS: TestListNoFilter
--- PASS: TestListFilterByGasType
--- PASS: TestGetStats
PASS
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add gas-backend/internal/repository/
git commit -m "feat: Repository 层（Insert/List/GetByID/GetStats + 测试）"
```

---

## Task 5: HTTP Handlers (TDD)

**Files:**
- Create: `gas-backend/internal/handler/plume_handler.go`
- Create: `gas-backend/internal/handler/plume_handler_test.go`

- [ ] **Step 1: Write failing tests**

```go
// gas-backend/internal/handler/plume_handler_test.go
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
		Geometry:     `{"type":"Polygon","coordinates":[]}`,
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
	// Create a temp tif file as testdata
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
```

- [ ] **Step 2: Run tests — expect compile failure**

```bash
cd gas-backend
go test ./internal/handler/...
```

Expected: compile error — `handler` package not found.

- [ ] **Step 3: Implement handlers**

```go
// gas-backend/internal/handler/plume_handler.go
package handler

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gaswatch/backend/internal/model"
	"gaswatch/backend/internal/repository"
)

func Register(r *gin.Engine, repo *repository.PlumeRepo) {
	api := r.Group("/api")
	api.GET("/plumes", listPlumes(repo))
	api.GET("/plumes/:id", getPlume(repo))
	api.GET("/plumes/:id/tiff", getTiff(repo))
	api.GET("/stats", getStats(repo))
}

func listPlumes(repo *repository.PlumeRepo) gin.HandlerFunc {
	return func(c *gin.Context) {
		f := model.FilterCriteria{}

		if gt := c.Query("gasType"); gt != "" {
			f.GasTypes = strings.Split(gt, ",")
		}
		f.DateFrom = c.Query("dateFrom")
		f.DateTo = c.Query("dateTo")
		f.Satellite = c.Query("satellite")
		f.Sector = c.Query("sector")

		if v := c.Query("fluxMin"); v != "" {
			if n, err := strconv.ParseFloat(v, 64); err == nil {
				f.FluxMin = &n
			}
		}
		if v := c.Query("fluxMax"); v != "" {
			if n, err := strconv.ParseFloat(v, 64); err == nil {
				f.FluxMax = &n
			}
		}

		plumes, total, err := repo.List(f)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if plumes == nil {
			plumes = []model.Plume{}
		}
		c.JSON(http.StatusOK, gin.H{"data": plumes, "total": total})
	}
}

func getPlume(repo *repository.PlumeRepo) gin.HandlerFunc {
	return func(c *gin.Context) {
		p, err := repo.GetByID(c.Param("id"))
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, p)
	}
}

func getTiff(repo *repository.PlumeRepo) gin.HandlerFunc {
	return func(c *gin.Context) {
		p, err := repo.GetByID(c.Param("id"))
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Header("Content-Type", "image/tiff")
		c.File(p.TiffPath)
	}
}

func getStats(repo *repository.PlumeRepo) gin.HandlerFunc {
	return func(c *gin.Context) {
		stats, err := repo.GetStats()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, stats)
	}
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd gas-backend
go test ./internal/handler/... -v
```

Expected:
```
--- PASS: TestGetPlumes
--- PASS: TestGetPlumeByID
--- PASS: TestGetPlumeByIDNotFound
--- PASS: TestGetStats
--- PASS: TestGetTiff
PASS
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add gas-backend/internal/handler/
git commit -m "feat: HTTP 处理器（list/get/tiff/stats + 测试）"
```

---

## Task 6: Server Entry Point

**Files:**
- Create: `gas-backend/cmd/server/main.go`

- [ ] **Step 1: Create server main**

```go
// gas-backend/cmd/server/main.go
package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gaswatch/backend/internal/db"
	"gaswatch/backend/internal/handler"
	"gaswatch/backend/internal/repository"
)

func main() {
	dbPath := getEnv("DB_PATH", "data/gas.db")
	allowedOrigin := getEnv("ALLOWED_ORIGIN", "http://localhost:4200")
	port := getEnv("PORT", "8080")

	database, err := db.Open(dbPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	repo := repository.NewPlumeRepo(database)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{allowedOrigin},
		AllowMethods:     []string{"GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: false,
	}))

	handler.Register(r, repo)

	log.Printf("GasWatch API listening on :%s", port)
	r.Run(":" + port)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd gas-backend
go build ./cmd/server/...
```

Expected: no output (success).

- [ ] **Step 3: Commit**

```bash
cd ..
git add gas-backend/cmd/server/main.go
git commit -m "feat: Gin 服务器入口（CORS + 路由注册）"
```

---

## Task 7: Import CLI — Phase 1 (Single Directory)

**Files:**
- Create: `gas-backend/cmd/import/main.go`

- [ ] **Step 1: Create import CLI**

```go
// gas-backend/cmd/import/main.go
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strconv"

	"gaswatch/backend/internal/db"
	"gaswatch/backend/internal/model"
	"gaswatch/backend/internal/repository"
)

var gasTypeRe = regexp.MustCompile(`_(CH4|CO|NO2)_`)

func main() {
	dir := flag.String("dir", "", "single rawdata directory to import")
	root := flag.String("root", "", "root directory to batch-import all subdirs")
	dbPath := flag.String("db", "data/gas.db", "path to SQLite database")
	flag.Parse()

	if *dir == "" && *root == "" {
		fmt.Fprintln(os.Stderr, "usage: import --dir <path> | --root <path>")
		os.Exit(1)
	}

	database, err := db.Open(*dbPath)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer database.Close()
	repo := repository.NewPlumeRepo(database)

	if *dir != "" {
		if err := importDir(*dir, repo); err != nil {
			log.Fatalf("import failed: %v", err)
		}
		fmt.Println("imported 1 / skipped 0 / errors 0")
		return
	}

	// batch mode
	entries, err := os.ReadDir(*root)
	if err != nil {
		log.Fatalf("cannot read root dir: %v", err)
	}
	imported, skipped, errors := 0, 0, 0
	for _, e := range entries {
		if !e.IsDir() {
			skipped++
			continue
		}
		if err := importDir(filepath.Join(*root, e.Name()), repo); err != nil {
			log.Printf("error importing %s: %v", e.Name(), err)
			errors++
		} else {
			imported++
		}
	}
	fmt.Printf("imported %d / skipped %d / errors %d\n", imported, skipped, errors)
}

func importDir(dir string, repo *repository.PlumeRepo) error {
	metaPath, err := findFile(dir, "_META.json")
	if err != nil {
		return fmt.Errorf("META.json not found: %w", err)
	}
	tifPath, err := findFile(dir, "_PLUME.tif")
	if err != nil {
		return fmt.Errorf("PLUME.tif not found: %w", err)
	}

	data, err := os.ReadFile(metaPath)
	if err != nil {
		return err
	}

	var fc struct {
		Features []struct {
			Geometry json.RawMessage        `json:"geometry"`
			Properties map[string]any       `json:"properties"`
		} `json:"features"`
	}
	if err := json.Unmarshal(data, &fc); err != nil {
		return fmt.Errorf("parse META.json: %w", err)
	}
	if len(fc.Features) == 0 {
		return fmt.Errorf("no features in %s", metaPath)
	}

	feat := fc.Features[0]
	props := feat.Properties
	geomBytes, _ := json.Marshal(feat.Geometry)

	dirName := filepath.Base(dir)
	gasType := extractGasType(dirName)

	p := model.Plume{
		ID:                        str(props["ID"]),
		Satellite:                 str(props["Satellite"]),
		Payload:                   str(props["Payload"]),
		ProductLevel:              str(props["Product Level"]),
		OverpassTime:              str(props["Overpass Time"]),
		Longitude:                 flt(props["Longitude"]),
		Latitude:                  flt(props["Latitude"]),
		Country:                   str(props["Country"]),
		Sector:                    str(props["Sector"]),
		GasType:                   gasType,
		FluxRate:                  flt(props[gasType+" Fluxrate"]),
		FluxRateStd:               flt(props[gasType+" Fluxrate STD"]),
		WindU:                     flt(props["Wind U"]),
		WindV:                     flt(props["Wind V"]),
		WindSpeed:                 flt(props["Wind Speed"]),
		DetectionInstitution:      str(props["Detection Institution"]),
		QuantificationInstitution: str(props["Quantification Institution"]),
		FeedbackOperator:          str(props["Feedback Operator"]),
		FeedbackGovernment:        str(props["Feedback Government"]),
		AdditionalInformation:     str(props["Additional Information"]),
		SharedOrganization:        str(props["Shared Organization"]),
		Geometry:                  string(geomBytes),
		TiffPath:                  tifPath,
	}

	return repo.Insert(p)
}

func findFile(dir, suffix string) (string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return "", err
	}
	for _, e := range entries {
		if !e.IsDir() && len(e.Name()) >= len(suffix) && e.Name()[len(e.Name())-len(suffix):] == suffix {
			return filepath.Join(dir, e.Name()), nil
		}
	}
	return "", fmt.Errorf("no file with suffix %s in %s", suffix, dir)
}

func extractGasType(dirname string) string {
	m := gasTypeRe.FindStringSubmatch(dirname)
	if len(m) >= 2 {
		return m[1]
	}
	return "CH4" // fallback
}

func str(v any) string {
	if v == nil {
		return ""
	}
	return fmt.Sprintf("%v", v)
}

func flt(v any) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case string:
		f, _ := strconv.ParseFloat(n, 64)
		return f
	}
	return 0
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd gas-backend
go build ./cmd/import/...
```

Expected: no output.

- [ ] **Step 3: Run Phase 1 import against real data**

```bash
cd gas-backend
mkdir -p data
go run ./cmd/import --dir ../data/rawdata/GAOFEN-5-01A_AHSI_L2B_20230319T200543_CH4_PLUME_V1_20251125_A0000092 --db data/gas.db
```

Expected:
```
imported 1 / skipped 0 / errors 0
```

- [ ] **Step 4: Verify data in DB**

```bash
sqlite3 data/gas.db "SELECT id, gas_type, flux_rate, country FROM plumes;"
```

Expected:
```
A0000092|CH4|1423.84209534555|United States of America
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add gas-backend/cmd/import/main.go
git commit -m "feat: 数据导入 CLI（Phase 1 单条 + Phase 2 批量）"
```

---

## Task 8: End-to-End Smoke Test

**Files:**
- Modify: `gas-frontend/src/environments/environment.ts`

- [ ] **Step 1: Start the backend server**

```bash
cd gas-backend
go run ./cmd/server
```

Expected:
```
GasWatch API listening on :8080
```

Leave this running in a terminal.

- [ ] **Step 2: Verify API responds**

In a new terminal:
```bash
curl http://localhost:8080/api/plumes
```

Expected:
```json
{"data":[{"id":"A0000092","gasType":"CH4",...}],"total":1}
```

```bash
curl http://localhost:8080/api/stats
```

Expected:
```json
{"totalDetections":1,"countriesCount":1,"gasTypesCount":1,"latestDetectionDate":"2023-03-19T20:05:43"}
```

```bash
curl -I http://localhost:8080/api/plumes/A0000092/tiff
```

Expected: `HTTP/1.1 200 OK` with `Content-Type: image/tiff`

- [ ] **Step 3: Switch frontend to real API**

Edit `gas-frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  useMock: false,
  apiUrl: 'http://localhost:8080'
};
```

- [ ] **Step 4: Start frontend and verify**

```bash
cd gas-frontend
npm start
```

Open `http://localhost:4200`. Verify:
- Map page shows the A0000092 plume marker near West Texas (longitude -103.5, latitude 31.3)
- Clicking marker opens detail drawer with correct data
- Stats bar on landing page shows: 1 detection, 1 country, 1 gas type

- [ ] **Step 5: Commit**

```bash
cd ..
git add gas-frontend/src/environments/environment.ts
git commit -m "feat: 前端切换真实 API（useMock: false）"
```

---

## Task 9: Final Tests & Push

- [ ] **Step 1: Run all backend tests**

```bash
cd gas-backend
go test ./... -v
```

Expected: all PASS.

- [ ] **Step 2: Revert environment.ts to mock (default for dev)**

Edit `gas-frontend/src/environments/environment.ts` back to:
```typescript
export const environment = {
  production: false,
  useMock: true,
  apiUrl: 'http://localhost:8080'
};
```

This is the safe default — real API requires the backend server to be running.

- [ ] **Step 3: Commit and push**

```bash
git add gas-frontend/src/environments/environment.ts
git commit -m "chore: 恢复前端默认 useMock: true"
git push
```

---

## Success Criteria Checklist

- [ ] `go test ./...` — all PASS
- [ ] `go run ./cmd/import --dir ...` 成功导入 A0000092
- [ ] `sqlite3 data/gas.db "SELECT * FROM plumes"` 有 1 条记录
- [ ] `GET /api/plumes` 返回正确 JSON
- [ ] `GET /api/plumes/A0000092` 返回完整 Plume 对象
- [ ] `GET /api/plumes/A0000092/tiff` 返回 TIFF 文件 (200)
- [ ] `GET /api/stats` 返回正确统计
- [ ] 前端 `useMock: false` 地图显示真实数据
