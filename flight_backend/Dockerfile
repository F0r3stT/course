FROM golang:1.24-alpine

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o flight_backend .

# Настроить только дефолты, а реальные значения передавать через docker-compose
ENV APP_ENV=dev
ENV JWT_TTL=1h
ENV LOGIN_RATE_RPS=3
ENV LOGIN_BURST=10
ENV CORS_ORIGIN=http://localhost:5173

EXPOSE 8080

CMD ["./flight_backend"]
