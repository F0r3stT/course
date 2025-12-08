package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// AuditLog - структура для аудита действий
type AuditLog struct {
	ID         int64           `json:"id"`
	Action     string          `json:"action"`
	UserID     *int64          `json:"user_id,omitempty"`
	Username   string          `json:"username"`
	UserRole   string          `json:"user_role"`
	IPAddress  string          `json:"ip_address"`
	UserAgent  string          `json:"user_agent"`
	Resource   string          `json:"resource"`
	ResourceID string          `json:"resource_id,omitempty"`
	Details    json.RawMessage `json:"details,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
}

// AuditLogger - логгер аудита
type AuditLogger struct {
	db *pgxpool.Pool
}

func NewAuditLogger(db *pgxpool.Pool) *AuditLogger {
	return &AuditLogger{db: db}
}

// Log - запись события аудита
func (l *AuditLogger) Log(ctx context.Context, event AuditLog) error {
	query := `
		INSERT INTO audit_logs (
			action, user_id, username, user_role, ip_address, user_agent,
			resource, resource_id, details
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err := l.db.Exec(ctx, query,
		event.Action,
		event.UserID,
		event.Username,
		event.UserRole,
		event.IPAddress,
		event.UserAgent,
		event.Resource,
		event.ResourceID,
		event.Details,
	)

	return err
}

// LogFlightEvent - аудит действий с рейсами
func (l *AuditLogger) LogFlightEvent(ctx context.Context, action string, flightID int64, userID int64, username, role, ip string, details interface{}) error {
	detailsJSON, _ := json.Marshal(details)

	event := AuditLog{
		Action:     action,
		UserID:     &userID,
		Username:   username,
		UserRole:   role,
		IPAddress:  ip,
		Resource:   "flight",
		ResourceID: fmt.Sprintf("%d", flightID),
		Details:    detailsJSON,
	}

	return l.Log(ctx, event)
}

// LogAuthEvent - аудит действий аутентификации
func (l *AuditLogger) LogAuthEvent(ctx context.Context, action string, username, role, ip, userAgent string, success bool) error {
	details := map[string]interface{}{
		"success": success,
		"ip":      ip,
	}
	detailsJSON, _ := json.Marshal(details)

	event := AuditLog{
		Action:    action,
		Username:  username,
		UserRole:  role,
		IPAddress: ip,
		UserAgent: userAgent,
		Resource:  "auth",
		Details:   detailsJSON,
	}

	return l.Log(ctx, event)
}

// GetUserActivity - получение активности пользователя
func (l *AuditLogger) GetUserActivity(ctx context.Context, userID int64, limit int) ([]AuditLog, error) {
	query := `
		SELECT id, action, user_id, username, user_role, ip_address, 
		       user_agent, resource, resource_id, details, created_at
		FROM audit_logs
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := l.db.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []AuditLog
	for rows.Next() {
		var log AuditLog
		if err := rows.Scan(
			&log.ID,
			&log.Action,
			&log.UserID,
			&log.Username,
			&log.UserRole,
			&log.IPAddress,
			&log.UserAgent,
			&log.Resource,
			&log.ResourceID,
			&log.Details,
			&log.CreatedAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}

	return logs, nil
}
