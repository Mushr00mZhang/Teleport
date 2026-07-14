package models

import (
	"crypto/md5"
	"encoding/hex"
	"strings"

	"gorm.io/gorm"
)

// User 用户表模型（GORM）
type User struct {
	ID       int64  `json:"id" gorm:"primaryKey"`
	Username string `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Nickname string `json:"nickname" gorm:"size:100;not null"`
	Password string `json:"-" gorm:"size:32;not null"` // MD5 十六进制，32 位
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// EnsureUsersTable 自动迁移 users 表（幂等）
func EnsureUsersTable(db *gorm.DB) error {
	return db.AutoMigrate(&User{})
}

// HashPassword 对密码进行 MD5 加密
func HashPassword(password string) string {
	sum := md5.Sum([]byte(password))
	return hex.EncodeToString(sum[:])
}

// VerifyPassword 校验密码是否与存储的 MD5 一致
func (u *User) VerifyPassword(password string) bool {
	return u.Password == HashPassword(password)
}

// CreateUser 创建新用户，返回带 id 的用户对象
func CreateUser(db *gorm.DB, username, nickname, password string) (*User, error) {
	user := &User{
		Username: username,
		Nickname: nickname,
		Password: HashPassword(password),
	}
	if err := db.Create(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

// GetUserByUsername 根据用户名查询用户
func GetUserByUsername(db *gorm.DB, username string) (*User, error) {
	user := &User{}
	if err := db.Where("username = ?", username).First(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

// IsUniqueViolation 判断是否为唯一约束冲突
func IsUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "duplicate key")
}
