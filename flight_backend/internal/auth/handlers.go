package auth

import (
	"log"
	"net/http"

	"flight_backend/internal/users"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Users users.Repository
}

func NewHandler(usersRepo users.Repository) *Handler {
	return &Handler{Users: usersRepo}
}

// RegisterRoutes регистрирует маршруты авторизации.
func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.POST("/api/auth/login", h.Login)
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *Handler) Login(c *gin.Context) {
	var req loginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
		return
	}

	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and password are required"})
		return
	}

	ctx := c.Request.Context()
	user, err := h.Users.GetByUsername(ctx, req.Username)
	if err != nil {
		// по безопасности: не раскрываем, существует ли пользователь
		log.Printf("login: user not found or db error: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := CheckPassword(user.PasswordHash, req.Password); err != nil {
		log.Printf("login: invalid password for user %s", user.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := GenerateToken(user.ID, string(user.Role))
	if err != nil {
		log.Printf("login: generate token error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
		},
	})
}
