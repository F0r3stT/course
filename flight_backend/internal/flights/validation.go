package flights

import (
	"errors"
	"strings"
	"time"
)

// допустимые статусы рейса — синхронизированы с CHECK в БД (schema.sql)
var allowedStatuses = map[string]struct{}{
	"scheduled": {},
	"boarding":  {},
	"delayed":   {},
	"cancelled": {},
	"in_air":    {},
	"landed":    {},
}

// validateFlightRequest — общая валидация для создания/обновления рейса.
// На вход принимает DTO из запроса и возвращает готовые time.Time.
func validateFlightRequest(
	flightNumber, airlineCode, depAirport, arrAirport,
	status, depTimeStr, arrTimeStr string,
) (time.Time, time.Time, error) {
	flightNumber = strings.TrimSpace(flightNumber)
	airlineCode = strings.TrimSpace(airlineCode)
	depAirport = strings.ToUpper(strings.TrimSpace(depAirport))
	arrAirport = strings.ToUpper(strings.TrimSpace(arrAirport))
	status = strings.TrimSpace(status)

	if flightNumber == "" {
		return time.Time{}, time.Time{}, errors.New("номер рейса обязателен")
	}
	if len(flightNumber) > 20 {
		return time.Time{}, time.Time{}, errors.New("номер рейса слишком длинный")
	}

	// IATA-коды аэропортов
	if len(depAirport) != 3 || len(arrAirport) != 3 {
		return time.Time{}, time.Time{}, errors.New("IATA-коды аэропортов должны быть из 3 символов")
	}

	// airline_code: либо пусто, либо ровно 2 символа
	if airlineCode != "" && len(airlineCode) != 2 {
		return time.Time{}, time.Time{}, errors.New("код авиакомпании должен быть из 2 символов")
	}

	// статус
	if _, ok := allowedStatuses[status]; !ok {
		return time.Time{}, time.Time{}, errors.New("недопустимый статус рейса")
	}

	if depTimeStr == "" || arrTimeStr == "" {
		return time.Time{}, time.Time{}, errors.New("время вылета и прилёта обязательно")
	}

	depTime, err := time.Parse(time.RFC3339, depTimeStr)
	if err != nil {
		return time.Time{}, time.Time{}, errors.New("неверный формат времени вылета (ожидается RFC3339)")
	}
	arrTime, err := time.Parse(time.RFC3339, arrTimeStr)
	if err != nil {
		return time.Time{}, time.Time{}, errors.New("неверный формат времени прилёта (ожидается RFC3339)")
	}

	// бизнес-правило: прилёт должен быть после вылета
	if !arrTime.After(depTime) {
		return time.Time{}, time.Time{}, errors.New("время прилёта должно быть позже вылета")
	}

	return depTime, arrTime, nil
}

// validateStatusOnly — валидация для PATCH /status
func validateStatusOnly(status string) error {
	status = strings.TrimSpace(status)
	if status == "" {
		return errors.New("статус обязателен")
	}
	if _, ok := allowedStatuses[status]; !ok {
		return errors.New("недопустимый статус рейса")
	}
	return nil
}
