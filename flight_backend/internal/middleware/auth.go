// internal/middleware/auth.go
package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID   int64  `json:"user_id"`
	Role     string `json:"role"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func AuthRequired() gin.HandlerFunc {
	secret := os.Getenv("JWT_SECRET")

	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// Публичные GET-роуты
		if c.Request.Method == http.MethodGet {
			if strings.HasPrefix(path, "/api/flights") ||
				strings.HasPrefix(path, "/api/airlines") ||
				strings.HasPrefix(path, "/api/stats") ||
				path == "/api/ping" {
				c.Next()
				return
			}
		}

		if strings.HasPrefix(path, "/api/auth/") {
			c.Next()
			return
		}

		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Требуется авторизация",
				"code":  "AUTH_REQUIRED",
			})
			return
		}

		tokenString := strings.TrimPrefix(header, "Bearer ")

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Недействительный токен",
				"code":  "INVALID_TOKEN",
			})
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Ошибка проверки токена",
				"code":  "TOKEN_ERROR",
			})
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("userRole", claims.Role)
		c.Set("username", claims.Username)

		c.Next()
	}
}

// RequireRole проверяет, имеет ли пользователь нужную роль
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("userRole")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Доступ запрещён",
				"code":  "ACCESS_DENIED",
			})
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Некорректная роль пользователя",
				"code":  "INVALID_ROLE",
			})
			return
		}

		// Проверяем, есть ли роль в разрешённых
		for _, allowed := range allowedRoles {
			if roleStr == allowed {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error": "Недостаточно прав для выполнения операции",
			"code":  "INSUFFICIENT_PERMISSIONS",
		})
	}
}
