package users

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresRepository — конструктор, который мы вызываем в main.go.
func NewPostgresRepository(pool *pgxpool.Pool) Repository {
	return &postgresRepository{pool: pool}
}

func (r *postgresRepository) GetByUsername(ctx context.Context, username string) (*User, error) {
	const query = `
		SELECT id, username, password_hash, role, created_at
		FROM users
		WHERE username = $1
	`

	row := r.pool.QueryRow(ctx, query, username)

	var u User
	if err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.CreatedAt); err != nil {
		return nil, err
	}

	return &u, nil
}
