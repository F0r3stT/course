package flights

import (
	"errors"
	"regexp"
	"strings"
	"time"
)

var allowedStatuses = map[string]struct{}{
	"scheduled": {},
	"boarding":  {},
	"delayed":   {},
	"cancelled": {},
	"in_air":    {},
	"landed":    {},
}

var flightNumDigits = regexp.MustCompile(`^[0-9]{3,6}$`)
var airlineCodeRe = regexp.MustCompile(`^[A-Z0-9]{2}$`)

func validateFlightRequest(
	flightNumber, airlineCode, depAirport, arrAirport,
	status, depTimeStr, arrTimeStr string,
) (time.Time, time.Time, error) {
	flightNumber = strings.TrimSpace(flightNumber)
	airlineCode = strings.ToUpper(strings.TrimSpace(airlineCode))
	depAirport = strings.ToUpper(strings.TrimSpace(depAirport))
	arrAirport = strings.ToUpper(strings.TrimSpace(arrAirport))
	status = strings.TrimSpace(status)

	if !flightNumDigits.MatchString(flightNumber) {
		return time.Time{}, time.Time{}, errors.New("номер рейса должен содержать только 3–6 цифр")
	}

	// airline_code: либо пусто, либо 2 символа по regex
	if airlineCode != "" && !airlineCodeRe.MatchString(airlineCode) {
		return time.Time{}, time.Time{}, errors.New("код авиакомпании должен содержать 2 символа (буквы/цифры)")
	}

	// IATA-коды аэропортов
	if len(depAirport) != 3 || len(arrAirport) != 3 {
		return time.Time{}, time.Time{}, errors.New("IATA-коды аэропортов должны быть из 3 символов")
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

	if !arrTime.After(depTime) {
		return time.Time{}, time.Time{}, errors.New("время прилёта должно быть позже вылета")
	}

	return depTime, arrTime, nil
}
func validateStatusOnly(status string) error {
	status = strings.TrimSpace(status)

	if _, ok := allowedStatuses[status]; !ok {
		return errors.New("недопустимый статус рейса")
	}

	return nil
}
