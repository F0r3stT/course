package users

import "context"

type Service struct {
	repo Repository
}

// NewService — конструктор сервиса.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// GetByUsername просто прокидывает вызов в репозиторий.
// Здесь можно будет добавлять бизнес-логику (аудит, кэш, правила и т.п.).
func (s *Service) GetByUsername(ctx context.Context, username string) (*User, error) {
	return s.repo.GetByUsername(ctx, username)
}
