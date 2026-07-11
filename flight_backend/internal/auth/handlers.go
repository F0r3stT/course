// internal/auth/handlers.go
package auth

import (
	"context"
	"errors"
	"log"
	"net/http"
	"regexp"
	"time"

	"flight_backend/internal/users"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Users users.Repository
}

func NewHandler(usersRepo users.Repository) *Handler {
	return &Handler{Users: usersRepo}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	authGroup := r.Group("/api/auth")
	{
		authGroup.POST("/login", h.Login)
		authGroup.POST("/register", h.Register)
		authGroup.POST("/logout", h.Logout)
	}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6,max=100"`
	Email    string `json:"email" binding:"required,email"`
	FullName string `json:"full_name" binding:"required"`
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверный формат данных",
			"code":  "INVALID_FORMAT",
		})
		return
	}

	ip := c.ClientIP()
	log.Printf("audit: login_attempt username=%s ip=%s", req.Username, ip)

	ctx := c.Request.Context()
	user, err := h.Users.GetByUsername(ctx, req.Username)
	if err != nil {
		log.Printf("audit: login_failed username=%s ip=%s reason=user_not_found", req.Username, ip)
		time.Sleep(2 * time.Second) // Защита от брутфорса
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Неверный логин или пароль",
			"code":  "INVALID_CREDENTIALS",
		})
		return
	}
	if err := CheckPassword(user.PasswordHash, req.Password); err != nil {
		log.Printf("audit: login_failed username=%s ip=%s reason=bad_password", req.Username, ip)
		time.Sleep(2 * time.Second)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Неверный логин или пароль",
			"code":  "INVALID_CREDENTIALS",
		})
		return
	}

	go func() {
		ctxBg := context.Background()
		h.Users.UpdateLastLogin(ctxBg, req.Username)
	}()

	token, err := GenerateToken(user.ID, string(user.Role), user.Username)
	if err != nil {
		log.Printf("login: generate token error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка генерации токена",
			"code":  "TOKEN_ERROR",
		})
		return
	}

	log.Printf("audit: login_success username=%s ip=%s role=%s", user.Username, ip, user.Role)

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
			"email":    user.Email,
			"fullName": user.FullName,
		},
	})
}

func (h *Handler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверный формат данных",
			"code":  "INVALID_FORMAT",
		})
		return
	}

	// Валидация имени пользователя (только латинские буквы и цифры)
	if matched, _ := regexp.MatchString("^[a-zA-Z0-9_]+$", req.Username); !matched {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Имя пользователя может содержать только латинские буквы, цифры и подчёркивание",
			"code":  "INVALID_USERNAME",
		})
		return
	}

	// Хэшируем пароль
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		log.Printf("register: hash password error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка обработки пароля",
			"code":  "PASSWORD_ERROR",
		})
		return
	}

	// Создаём пользователя
	user := &users.User{
		Username:     req.Username,
		PasswordHash: hashedPassword,
		Email:        &req.Email,
		FullName:     &req.FullName,
		Role:         users.RoleViewer, // Все новые пользователи - только viewer
		IsActive:     true,
	}

	ctx := c.Request.Context()
	if err := h.Users.Create(ctx, user); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" { // unique_violation
			c.JSON(http.StatusConflict, gin.H{
				"error": "Пользователь с таким именем уже существует",
				"code":  "USER_EXISTS",
			})
			return
		}

		log.Printf("register: create user error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка создания пользователя",
			"code":  "CREATE_ERROR",
		})
		return
	}

	// Генерируем токен
	token, err := GenerateToken(user.ID, string(user.Role), user.Username)
	if err != nil {
		log.Printf("register: generate token error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка генерации токена",
			"code":  "TOKEN_ERROR",
		})
		return
	}

	log.Printf("audit: register_success username=%s ip=%s", user.Username, c.ClientIP())

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
			"email":    user.Email,
			"fullName": user.FullName,
		},
		"message": "Регистрация успешна. Ваша роль: Наблюдатель",
	})
}

func (h *Handler) Logout(c *gin.Context) {
	// В JWT-based аутентификации logout обычно делается на клиенте
	// Просто возвращаем успех
	c.JSON(http.StatusOK, gin.H{
		"message": "Выход выполнен успешно",
	})
}
