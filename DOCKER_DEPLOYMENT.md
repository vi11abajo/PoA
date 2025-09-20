# 🐳 Docker Deployment Guide - Pharos Invaders

Руководство по развертыванию игры Pharos Invaders в Docker контейнере на Ubuntu 22.04 под root пользователем.

## 📋 Содержание
- [Требования](#требования)
- [Подготовка сервера](#подготовка-сервера)
- [Установка Docker](#установка-docker)
- [Простое развертывание](#простое-развертывание)
- [Развертывание с SSL](#развертывание-с-ssl)
- [Управление контейнерами](#управление-контейнерами)
- [Мониторинг и логи](#мониторинг-и-логи)
- [Обновление](#обновление)
- [Устранение неполадок](#устранение-неполадок)

## 🔧 Требования

### Сервер:
- Ubuntu 22.04 LTS
- Минимум 1GB RAM
- 5GB свободного места
- Открытые порты: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- Root доступ

## 🖥️ Подготовка сервера

### 1. Подключение к серверу под root
```bash
ssh root@your-server-ip
```

### 2. Обновление системы
```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем необходимые пакеты
apt install -y curl wget git unzip ca-certificates gnupg lsb-release
```

## 🐳 Установка Docker

### 1. Установка Docker Engine
```bash
# Добавляем официальный GPG ключ Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Добавляем репозиторий Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Обновляем список пакетов и устанавливаем Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Запускаем и включаем автозапуск Docker
systemctl start docker
systemctl enable docker

# Проверяем установку
docker --version
docker compose version
```

### 2. Проверка работы Docker
```bash
# Тестируем Docker
docker run hello-world

# Проверяем статус
systemctl status docker
```

## 🚀 Простое развертывание

### 1. Клонирование проекта
```bash
# Создаем директорию и клонируем проект
mkdir -p /root/poa
cd /root/poa

# Клонируем репозиторий
git clone https://github.com/vi11abajo/PoA.git .

# Проверяем файлы
ls -la
```

### 2. Сборка и запуск контейнера
```bash
# Собираем Docker образ
docker compose build

# Запускаем контейнер
docker compose up -d

# Проверяем статус
docker compose ps
```

### 3. Проверка работы
```bash
# Проверяем доступность сайта
curl -I http://localhost

# Или с внешнего IP
curl -I http://your-server-ip

# Проверяем логи
docker compose logs -f
```

## 🔒 Развертывание с SSL (Traefik)

### 1. Настройка переменных окружения
```bash
# Создаем .env файл
cat > /root/poa/.env << 'EOF'
DOMAIN_NAME=your-domain.com
TRAEFIK_EMAIL=your-email@example.com
EOF
```

### 2. Обновление конфигурации Traefik
```bash
# Редактируем traefik.yml
nano docker/traefik.yml

# Замените your-email@example.com на ваш реальный email
sed -i 's/your-email@example.com/your-real-email@example.com/g' docker/traefik.yml
```

### 3. Запуск с Traefik и SSL
```bash
# Останавливаем простую версию (если запущена)
docker compose down

# Запускаем с Traefik профилем
docker compose --profile traefik up -d

# Проверяем статус
docker compose ps
```

### 4. Проверка SSL
```bash
# Ждем несколько минут для получения сертификата
sleep 60

# Проверяем HTTPS
curl -I https://your-domain.com

# Проверяем Traefik dashboard
curl -I http://your-server-ip:8080
```

## 🎛️ Управление контейнерами

### Основные команды
```bash
# Посмотреть статус контейнеров
docker compose ps

# Посмотреть логи
docker compose logs -f

# Перезапустить контейнеры
docker compose restart

# Остановить контейнеры
docker compose down

# Остановить и удалить volumes
docker compose down -v

# Пересобрать образ
docker compose build --no-cache

# Обновить и перезапустить
docker compose pull && docker compose up -d
```

### Работа с отдельными контейнерами
```bash
# Подключиться к контейнеру
docker exec -it pharos-invaders /bin/sh

# Посмотреть логи конкретного контейнера
docker logs pharos-invaders

# Перезапустить контейнер
docker restart pharos-invaders

# Посмотреть статистику использования ресурсов
docker stats
```

## 📊 Мониторинг и логи

### 1. Просмотр логов
```bash
# Логи всех сервисов
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f poa-game

# Последние 100 строк логов
docker compose logs --tail=100 poa-game

# Логи Nginx внутри контейнера
docker exec pharos-invaders tail -f /var/log/nginx/access.log
docker exec pharos-invaders tail -f /var/log/nginx/error.log
```

### 2. Мониторинг ресурсов
```bash
# Использование ресурсов контейнерами
docker stats

# Информация о контейнере
docker inspect pharos-invaders

# Размер образов
docker images

# Использование места Docker
docker system df
```

### 3. Health check
```bash
# Проверка health status
docker ps

# Ручная проверка health check
docker exec pharos-invaders curl -f http://localhost/ || echo "Health check failed"
```

## 🔄 Обновление

### 1. Обновление кода игры
```bash
cd /root/poa

# Создаем бэкап
docker compose down
cp -r /root/poa /root/poa_backup_$(date +%Y%m%d_%H%M%S)

# Получаем обновления
git pull origin main

# Пересобираем и запускаем
docker compose build --no-cache
docker compose up -d

# Проверяем работу
docker compose ps
curl -I http://your-server-ip
```

### 2. Обновление Docker образов
```bash
# Обновляем базовые образы
docker compose pull

# Перезапускаем с новыми образами
docker compose up -d

# Очищаем старые образы
docker image prune -f
```

## 📁 Структура файлов в контейнере

```
/var/www/poa/
├── index.html              # Главная страница
├── game.js                 # Основной код игры
├── sound-manager.js        # Звуковая система
├── images/                 # Изображения игры
│   ├── *.png, *.gif       # Спрайты и анимации
│   └── ...
├── sounds/                 # Звуки и музыка
│   ├── music/             # Фоновая музыка
│   ├── sfx/               # Звуковые эффекты
│   └── ...
├── boosts/                # Система усилений
├── boss-system/           # Система боссов
├── tournament/            # Турнирная система
└── ...
```

## 🆘 Устранение неполадок

### Контейнер не запускается
```bash
# Проверяем логи сборки
docker compose build

# Проверяем логи запуска
docker compose logs

# Проверяем конфигурацию
docker compose config

# Запускаем в интерактивном режиме
docker compose run --rm poa-game /bin/sh
```

### Игра не загружается
```bash
# Проверяем доступность изнутри контейнера
docker exec pharos-invaders curl -I http://localhost

# Проверяем файлы игры
docker exec pharos-invaders ls -la /var/www/poa/

# Проверяем права доступа
docker exec pharos-invaders ls -la /var/www/poa/images/
docker exec pharos-invaders ls -la /var/www/poa/sounds/

# Проверяем конфигурацию Nginx
docker exec pharos-invaders nginx -t
```

### Проблемы со звуком
```bash
# Проверяем наличие звуковых файлов
docker exec pharos-invaders find /var/www/poa/sounds -name "*.mp3" -o -name "*.wav"

# Проверяем права на звуковые файлы
docker exec pharos-invaders ls -la /var/www/poa/sounds/music/
docker exec pharos-invaders ls -la /var/www/poa/sounds/sfx/
```

### SSL проблемы (при использовании Traefik)
```bash
# Проверяем логи Traefik
docker compose logs traefik

# Проверяем статус сертификатов
docker exec traefik ls -la /letsencrypt/

# Принудительное обновление сертификата
docker compose restart traefik
```

### Очистка системы
```bash
# Остановка всех контейнеров
docker compose down

# Удаление неиспользуемых образов
docker image prune -f

# Удаление неиспользуемых volumes
docker volume prune -f

# Полная очистка Docker (ОСТОРОЖНО!)
docker system prune -a -f
```

## 🔧 Дополнительные настройки

### 1. Настройка автозапуска
```bash
# Добавляем в systemd для автозапуска при перезагрузке
cat > /etc/systemd/system/poa-game.service << 'EOF'
[Unit]
Description=Pharos Invaders Game
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/root/poa
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Включаем автозапуск
systemctl enable poa-game.service
systemctl start poa-game.service
```

### 2. Настройка файрвола (если используется)
```bash
# Если ufw включен
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp  # Для Traefik dashboard
ufw reload
```

### 3. Бэкап volumes
```bash
# Создание бэкапа volumes
docker run --rm -v poa_nginx_logs:/source -v /root/backups:/backup alpine tar -czf /backup/nginx_logs_$(date +%Y%m%d).tar.gz -C /source .
docker run --rm -v poa_letsencrypt_certs:/source -v /root/backups:/backup alpine tar -czf /backup/letsencrypt_$(date +%Y%m%d).tar.gz -C /source .
```

## 📞 Полезные алиасы

Добавьте в `/root/.bashrc` для удобства:

```bash
# Docker aliases для управления игрой
alias poa-status='cd /root/poa && docker compose ps'
alias poa-logs='cd /root/poa && docker compose logs -f'
alias poa-restart='cd /root/poa && docker compose restart'
alias poa-update='cd /root/poa && git pull && docker compose build --no-cache && docker compose up -d'
alias poa-shell='docker exec -it pharos-invaders /bin/sh'

# Применяем изменения
source /root/.bashrc
```

---

🎮 **Готово! Игра Pharos Invaders запущена в Docker контейнере!**

**Быстрый старт:**
1. `docker compose up -d` - запуск
2. `docker compose logs -f` - просмотр логов
3. `http://your-server-ip` - игра доступна

**С SSL:**
1. Настройте домен и email в `.env`
2. `docker compose --profile traefik up -d`
3. `https://your-domain.com` - игра с SSL