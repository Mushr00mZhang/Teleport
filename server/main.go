package main

import (
	"log"
	"os"
	"path/filepath"
	"server/config"
	"server/db"
	"server/models"
	"server/websocket"
	"strings"
	"time"
	_ "time/tzdata"
)

func main() {
	// 设置 timezone，默认 Asia/Shanghai
	tz := os.Getenv("TZ")
	if strings.TrimSpace(tz) == "" {
		tz = "Asia/Shanghai"
	}
	time.LoadLocation(tz)

	// 加载配置文件
	cfg, err := config.Load(filepath.Join(".", "config.yml"))
	if err != nil {
		log.Fatalf("load config failed: %v", err)
	}

	// 数据库连接
	dsn := cfg.Database.DSN
	pool, err := db.NewPool(dsn)
	if err != nil {
		log.Fatalf("init database failed: %v", err)
	}
	defer db.Close(pool)

	// 确保用户表存在
	if err := models.EnsureUsersTable(pool); err != nil {
		log.Fatalf("ensure users table failed: %v", err)
	}
	log.Println("database inited")

	ws := websocket.NewServer("", 8889, pool)
	ws.Listen()
}
