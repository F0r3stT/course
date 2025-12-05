package users

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PGRepository struct {
	db *pgxpool.Pool
}

func NewPGRepository(db *pgxpool.Pool) Repository {
	return &PGRepository{db: db}
}

func (r *PGRepository) GetByUsername(ctx context.Context, username string) (*User, error) {
	const query = `
        SELECT id, username, password_hash, role
        FROM users
        WHERE username = $1
        LIMIT 1;
    `

	row := r.db.QueryRow(ctx, query, username)

	var u User
	if err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role); err != nil {
		return nil, err
	}
	return &u, nil
}
