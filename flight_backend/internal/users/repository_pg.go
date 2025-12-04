package users

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PGRepository struct {
	DB *pgxpool.Pool
}

func NewPGRepository(db *pgxpool.Pool) *PGRepository {
	return &PGRepository{DB: db}
}

func (r *PGRepository) GetByUsername(ctx context.Context, username string) (*User, error) {
	const query = `
        SELECT id, username, password_hash, role
        FROM users
        WHERE username = $1;
    `

	row := r.DB.QueryRow(ctx, query, username)

	var u User
	if err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role); err != nil {
		return nil, fmt.Errorf("get user by username: %w", err)
	}

	return &u, nil
}
