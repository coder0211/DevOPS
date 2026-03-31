package models

import (
	"time"

	"gorm.io/gorm"
)

type ServerStatus string

const (
	StatusNew         ServerStatus = "NEW"
	StatusInitializing ServerStatus = "INITIALIZING"
	StatusReady       ServerStatus = "READY"
	StatusError       ServerStatus = "ERROR"
)

type Server struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	Name          string         `gorm:"size:255;not null" json:"name"`
	IP            string         `gorm:"size:45;not null" json:"ip"`
	SSHPort       int            `gorm:"default:22" json:"ssh_port"`
	SSHUser       string         `gorm:"size:100;not null" json:"ssh_user"`
	SSHKeyPath    string         `json:"ssh_key_path"` // Local path to the private key
	Status        ServerStatus   `gorm:"type:string;default:'NEW'" json:"status"`
	LastCheck     *time.Time     `json:"last_check"`
	CPUUsage      float64        `json:"cpu_usage"`
	RAMUsage      float64        `json:"ram_usage"`
	DiskUsage     float64        `json:"disk_usage"`
	Uptime        string         `json:"uptime"`
	DockerVersion string         `json:"docker_version"`
}

type Task struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	ServerID  uint      `json:"server_id"`
	Type      string    `json:"type"` // "INITIALIZATION", "NGINX_SETUP", "CLEANUP"
	Status    string    `json:"status"` // "PENDING", "RUNNING", "COMPLETED", "FAILED"
	Log       string    `json:"log"`
}

type Domain struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	ServerID  uint           `json:"server_id"`
	Name      string         `gorm:"uniqueIndex;not null" json:"name"` // e.g. example.com
	TargetPort int           `json:"target_port"`                      // Local port to proxy to
	SSLEnabled bool          `json:"ssl_enabled"`
	ConfigPath string        `json:"config_path"`
}
