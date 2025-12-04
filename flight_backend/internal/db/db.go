package db

import (
    "context"

    "github.com/jackc/pgx/v5/pgxpool"
)

// Connect создаёт пул соединений с PostgreSQL.
func Connect(ctx context.Context, connString string) (*pgxpool.Pool, error) {
    return pgxpool.New(ctx, connString)
}

