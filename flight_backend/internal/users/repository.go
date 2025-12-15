// internal/users/repository.go
package users

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Role string

const (
	RoleAdmin  Role = "admin"
	RoleStaff  Role = "staff"
	RoleViewer Role = "viewer"
)

type User struct {
	ID           int64      `json:"id"`
	Username     string     `json:"username"`
	PasswordHash string     `json:"-"`
	Email        *string    `json:"email,omitempty"`
	FullName     *string    `json:"full_name,omitempty"`
	Role         Role       `json:"role"`
	CreatedAt    time.Time  `json:"created_at"`
	LastLogin    *time.Time `json:"last_login,omitempty"`
	IsActive     bool       `json:"is_active"`
}

type Repository interface {
	GetByUsername(ctx context.Context, username string) (*User, error)
	GetByID(ctx context.Context, id int64) (*User, error)
	Create(ctx context.Context, user *User) error
	UpdateLastLogin(ctx context.Context, username string) error
}

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository(pool *pgxpool.Pool) Repository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) GetByUsername(ctx context.Context, username string) (*User, error) {
	var user User
	query := `
		SELECT id, username, password_hash, email, full_name, role, created_at, last_login, is_active
		FROM users 
		WHERE username = $1 AND is_active = true
	`

	err := r.pool.QueryRow(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Email,
		&user.FullName,
		&user.Role,
		&user.CreatedAt,
		&user.LastLogin,
		&user.IsActive,
	)
	if err != nil {
		return nil, fmt.Errorf("get user by username: %w", err)
	}

	return &user, nil
}

func (r *PostgresRepository) GetByID(ctx context.Context, id int64) (*User, error) {
	var user User
	query := `
		SELECT id, username, password_hash, email, full_name, role, created_at, last_login, is_active
		FROM users 
		WHERE id = $1 AND is_active = true
	`

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Email,
		&user.FullName,
		&user.Role,
		&user.CreatedAt,
		&user.LastLogin,
		&user.IsActive,
	)
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}

	return &user, nil
}

func (r *PostgresRepository) Create(ctx context.Context, user *User) error {
	query := `
		INSERT INTO users (username, password_hash, email, full_name, role, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`

	// По умолчанию все новые пользователи - viewer
	if user.Role == "" {
		user.Role = RoleViewer
	}

	err := r.pool.QueryRow(ctx, query,
		user.Username,
		user.PasswordHash,
		user.Email,
		user.FullName,
		user.Role,
		user.IsActive,
	).Scan(&user.ID, &user.CreatedAt)

	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}

	return nil
}

func (r *PostgresRepository) UpdateLastLogin(ctx context.Context, username string) error {
	query := `UPDATE users SET last_login = NOW() WHERE username = $1`
	_, err := r.pool.Exec(ctx, query, username)
	return err
}
