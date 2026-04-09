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
			Geometry   json.RawMessage        `json:"geometry"`
			Properties map[string]any         `json:"properties"`
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
	return "CH4"
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
