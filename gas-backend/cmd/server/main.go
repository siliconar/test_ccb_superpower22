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
