package auth

import "golang.org/x/crypto/bcrypt"

// HashPassword — хэширует пароль для хранения в БД (используется, если будешь добавлять регистрацию).
func HashPassword(plain string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CheckPassword — сравнивает хэш из БД и введённый пароль.
func CheckPassword(hash, plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
}
