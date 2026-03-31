package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"sync"

	"devops-manager/internal/models"
	"devops-manager/internal/ssh"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Handler struct {
	DB *gorm.DB
}

// Memory storage for task logs
var taskLogs = sync.Map{}

func (h *Handler) GetServers(c *gin.Context) {
	var servers []models.Server
	if err := h.DB.Find(&servers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, servers)
}

func (h *Handler) GetServer(c *gin.Context) {
	id := c.Param("id")
	var server models.Server
	if err := h.DB.First(&server, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}
	c.JSON(http.StatusOK, server)
}

func (h *Handler) DeleteServer(c *gin.Context) {
	id := c.Param("id")
	if err := h.DB.Delete(&models.Server{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Server deleted"})
}

func (h *Handler) CreateServer(c *gin.Context) {
	var server models.Server
	if err := c.ShouldBindJSON(&server); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	server.Status = models.StatusNew
	if err := h.DB.Create(&server).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, server)
}

func (h *Handler) InitializeServer(c *gin.Context) {
	id := c.Param("id")
	var server models.Server
	if err := h.DB.First(&server, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	taskID := uuid.New().String()
	task := models.Task{
		ID:       taskID,
		ServerID: server.ID,
		Type:     "INITIALIZATION",
		Status:   "RUNNING",
	}
	h.DB.Create(&task)

	// Async initialization
	go func() {
		client, err := ssh.NewSSHClient(server.SSHUser, server.IP, server.SSHKeyPath, server.SSHPort)
		if err != nil {
			h.updateTaskStatus(taskID, "FAILED", fmt.Sprintf("SSH connection failed: %v", err))
			return
		}

		// Read init script
		scriptContent, err := os.ReadFile("scripts/init_vps.sh")
		if err != nil {
			h.updateTaskStatus(taskID, "FAILED", fmt.Sprintf("Failed to read script: %v", err))
			return
		}

		outputChan := make(chan string)
		var logs string
		var mu sync.Mutex

		go func() {
			for logLine := range outputChan {
				mu.Lock()
				logs += logLine + "\n"
				taskLogs.Store(taskID, logs)
				mu.Unlock()
			}
		}()

		// Pass the script as a heredoc to bash
		fullCmd := fmt.Sprintf("sudo bash <<'EOF'\n%s\nEOF", string(scriptContent))
		
		err = client.ExecuteCommandStream(fullCmd, outputChan)
		if err != nil {
			h.updateTaskStatus(taskID, "FAILED", fmt.Sprintf("Execution failed: %v\nLogs: %s", err, logs))
			return
		}
		
		h.updateTaskStatus(taskID, "COMPLETED", logs)
		h.DB.Model(&server).Update("status", models.StatusReady)
	}()

	c.JSON(http.StatusAccepted, gin.H{"task_id": taskID})
}

func (h *Handler) updateTaskStatus(id, status, log string) {
	h.DB.Model(&models.Task{}).Where("id = ?", id).Updates(models.Task{
		Status: status,
		Log:    log,
	})
}

func (h *Handler) GetServerStats(c *gin.Context) {
	id := c.Param("id")
	var server models.Server
	if err := h.DB.First(&server, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Server not found"})
		return
	}

	// In a real app, this would be cached or periodic.
	// For now, we'll fetch real-time.
	client, err := ssh.NewSSHClient(server.SSHUser, server.IP, server.SSHKeyPath, server.SSHPort)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SSH failed"})
		return
	}

	// Commands to get stats
	cpuCmd := "top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'"
	memCmd := "free | grep Mem | awk '{print $3/$2 * 100.0}'"
	diskCmd := "df -h / | tail -1 | awk '{print $5}' | sed 's/%//'"

	cpu, _ := client.ExecuteCommand(cpuCmd)
	mem, _ := client.ExecuteCommand(memCmd)
	disk, _ := client.ExecuteCommand(diskCmd)

	// Update DB stats
	cf, _ := strconv.ParseFloat(cpu, 64)
	mf, _ := strconv.ParseFloat(mem, 64)
	df, _ := strconv.ParseFloat(disk, 64)

	h.DB.Model(&server).Updates(map[string]interface{}{
		"cpu_usage":  cf,
		"ram_usage":  mf,
		"disk_usage": df,
	})

	c.JSON(http.StatusOK, gin.H{
		"cpu":  cf,
		"ram":  mf,
		"disk": df,
	})
}

func (h *Handler) CreateDomain(c *gin.Context) {
	var domain models.Domain
	if err := c.ShouldBindJSON(&domain); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	serverID := c.Param("id")
	sid, _ := strconv.Atoi(serverID)
	domain.ServerID = uint(sid)

	if err := h.DB.Create(&domain).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// TODO: Trigger Nginx configuration on server
	c.JSON(http.StatusCreated, domain)
}

func (h *Handler) GetDomains(c *gin.Context) {
	id := c.Param("id")
	var domains []models.Domain
	if err := h.DB.Where("server_id = ?", id).Find(&domains).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, domains)
}
