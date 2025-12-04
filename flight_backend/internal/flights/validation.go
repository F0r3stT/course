package flights

import (
	"fmt"
	"time"
)

// validateFlightInput — проверяет корректность полей рейса и парсит время.
// проверка на данные не пустые
func validateFlightInput(
	flightNumber, depAirport, arrAirport, status, depStr, arrStr string,
) (time.Time, time.Time, error) {
	if flightNumber == "" {
		return time.Time{}, time.Time{}, fmt.Errorf("номер рейса не может быть пустым")
	}
	if status == "" {
		return time.Time{}, time.Time{}, fmt.Errorf("статус не может быть пустым")
	}

	if len(depAirport) != 3 || len(arrAirport) != 3 {
		return time.Time{}, time.Time{}, fmt.Errorf("коды аэропортов должны быть длиной 3 символа")
	}

	// проверка статуса по списку допустимых значений
	if _, ok := allowedStatuses[status]; !ok {
		return time.Time{}, time.Time{}, fmt.Errorf("недопустимый статус рейса: %s", status)
	}

	// парсим время
	depTime, err := time.Parse(time.RFC3339, depStr)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("некорректное время вылета: %w", err)
	}

	arrTime, err := time.Parse(time.RFC3339, arrStr)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("некорректное время прилёта: %w", err)
	}

	// проверка прилёта позже вылета
	if !arrTime.After(depTime) {
		return time.Time{}, time.Time{}, fmt.Errorf("время прилёта должно быть позже времени вылета")
	}

	return depTime, arrTime, nil
}
