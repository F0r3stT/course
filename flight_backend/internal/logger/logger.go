package logger

import (
	"log/slog"
	"os"
)

var Log *slog.Logger

func Init(env string) {
	var handler slog.Handler
	if env == "prod" {
		handler = slog.NewJSONHandler(os.Stdout, nil)
	} else {
		handler = slog.NewTextHandler(os.Stdout, nil)
	}

	Log = slog.New(handler)
}
