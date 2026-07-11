Запуск докер контейнера:
```
sudo docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```


Запуск туннелирования:
```
sudo docker run --rm -it --network host alpine:3.20 sh -lc '
  apk add --no-cache openssh-client &&
  ssh -vvv -o StrictHostKeyChecking=accept-new \
      -R 80:127.0.0.1:8081 nokey@localhost.run
'
```