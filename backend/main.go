package main

import (
	"log"
	"net/http"
	"os"

	"devops-manager/internal/handlers"
	"devops-manager/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	// DB path: use DATA_DIR env var (Docker volume) or fallback to local file
	dbPath := "devops.db"
	if dataDir := os.Getenv("DATA_DIR"); dataDir != "" {
		dbPath = dataDir + "/devops.db"
	}

	// Initialize Database
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// Run Migrations
	err = db.AutoMigrate(&models.Server{}, &models.Task{}, &models.Domain{})
	if err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	// Create scripts directory if it doesn't exist
	if _, err := os.Stat("scripts"); os.IsNotExist(err) {
		os.Mkdir("scripts", 0755)
	}

	r := gin.Default()

	// CORS Setup
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	h := &handlers.Handler{DB: db}

	api := r.Group("/api")
	{
		api.GET("/servers", h.GetServers)
		api.POST("/servers", h.CreateServer)
		api.GET("/servers/:id", h.GetServer)
		api.DELETE("/servers/:id", h.DeleteServer)
		api.POST("/servers/:id/init", h.InitializeServer)
		api.GET("/servers/:id/stats", h.GetServerStats)
		api.POST("/servers/:id/domains", h.CreateDomain)
		api.GET("/servers/:id/domains", h.GetDomains)
	}

	log.Println("DevOPS Backend starting on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
