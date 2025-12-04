package users

import "context"

// Repository описывает операции с пользователями.
type Repository interface {
	GetByUsername(ctx context.Context, username string) (*User, error)
}
