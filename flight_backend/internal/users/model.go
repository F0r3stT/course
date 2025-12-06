package users

import "time"

type Role string

const (
	RoleAdmin    Role = "admin"
	RoleOperator Role = "operator" // то, что у тебя в БД
	RoleViewer   Role = "viewer"
)

type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"` // "admin" / "operator" / "viewer"
	CreatedAt    time.Time `json:"created_at"`
}
