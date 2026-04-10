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

func plumeTiffURL(id string) string {
	return "/api/plumes/" + id + "/tiff"
}

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
		for i := range plumes {
			plumes[i].TiffURL = plumeTiffURL(plumes[i].ID)
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
		p.TiffURL = plumeTiffURL(p.ID)
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
