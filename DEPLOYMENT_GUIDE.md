# 🚀 Руководство по деплою игры Pharos Invaders

Пошаговое руководство по развертыванию игры на Ubuntu 22.04 VPS сервере.

## 📋 Содержание
- [Требования](#требования)
- [Подготовка сервера](#подготовка-сервера)
- [Установка и настройка Nginx](#установка-и-настройка-nginx)
- [Клонирование проекта](#клонирование-проекта)
- [Настройка файлов](#настройка-файлов)
- [Конфигурация Nginx](#конфигурация-nginx)
- [SSL сертификат (Let's Encrypt)](#ssl-сертификат-lets-encrypt)
- [Финальная проверка](#финальная-проверка)
- [Обслуживание](#обслуживание)

## 🔧 Требования

### Сервер:
- Ubuntu 22.04 LTS
- Минимум 1GB RAM
- 10GB свободного места
- Открытые порты: 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Локально:
- SSH доступ к серверу
- Доменное имя (опционально, для SSL)

## 🖥️ Подготовка сервера

### 1. Подключение к серверу
```bash
ssh root@your-server-ip
# или
ssh your-username@your-server-ip
```

### 2. Обновление системы
```bash
# Обновляем список пакетов
sudo apt update

# Обновляем установленные пакеты
sudo apt upgrade -y

# Устанавливаем необходимые базовые пакеты
sudo apt install -y curl wget git unzip software-properties-common
```

### 3. Создание пользователя (если работаете под root)
```bash
# Создаем пользователя для деплоя
sudo adduser deploy

# Добавляем в группу sudo
sudo usermod -aG sudo deploy

# Переключаемся на нового пользователя
su - deploy
```

## 🌐 Установка и настройка Nginx

### 1. Установка Nginx
```bash
# Устанавливаем Nginx
sudo apt install -y nginx

# Запускаем и добавляем в автозагрузку
sudo systemctl start nginx
sudo systemctl enable nginx

# Проверяем статус
sudo systemctl status nginx
```

### 2. Настройка файрвола (если включен)
```bash
# Проверяем статус UFW
sudo ufw status

# Если файрвол активен, разрешаем Nginx
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
```

### 3. Проверка работы Nginx
```bash
# Проверяем, что Nginx работает
curl -I http://localhost

# Должен вернуть HTTP/1.1 200 OK
```

## 📁 Клонирование проекта

### 1. Создание директории проекта
```bash
# Переходим в домашнюю директорию
cd ~

# Создаем директорию для проекта
mkdir -p poa
cd poa

# Проверяем текущий путь
pwd
# Должно быть: /home/deploy/poa (или /home/your-username/poa)
```

### 2. Клонирование репозитория
```bash
# Клонируем репозиторий в текущую директорию
git clone https://github.com/vi11abajo/PoA.git .

# Проверяем, что файлы скопировались
ls -la

# Должны увидеть: index.html, game.js, images/, sounds/, и другие файлы
```

### 3. Установка правильных прав доступа
```bash
# Устанавливаем права на все файлы
sudo chown -R www-data:www-data /home/deploy/poa
sudo chmod -R 755 /home/deploy/poa

# Для медиа файлов (изображения, звуки) устанавливаем права на чтение
sudo find /home/deploy/poa -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.gif" -o -name "*.mp3" -o -name "*.wav" \) -exec chmod 644 {} \;

# Для HTML, CSS, JS файлов
sudo find /home/deploy/poa -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" \) -exec chmod 644 {} \;
```

## ⚙️ Настройка файлов

### 1. Проверка структуры проекта
```bash
# Проверяем структуру файлов
tree /home/deploy/poa -L 2

# Или используем ls
ls -la /home/deploy/poa/
ls -la /home/deploy/poa/images/
ls -la /home/deploy/poa/sounds/
```

### 2. Создание файла robots.txt (опционально)
```bash
# Создаем robots.txt для поисковых систем
cat > /home/deploy/poa/robots.txt << 'EOF'
User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml
EOF
```

### 3. Создание файла .htaccess для безопасности
```bash
# Создаем .htaccess для дополнительной безопасности
cat > /home/deploy/poa/.htaccess << 'EOF'
# Защита от просмотра директорий
Options -Indexes

# Кэширование статических файлов
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType audio/mpeg "access plus 1 month"
    ExpiresByType audio/wav "access plus 1 month"
</IfModule>

# Сжатие файлов
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
EOF
```

## 🔧 Конфигурация Nginx

### 1. Создание конфигурации сайта
```bash
# Создаем конфигурацию для сайта
sudo nano /etc/nginx/sites-available/poa
```

**Вставляем следующую конфигурацию:**
```nginx
server {
    listen 80;
    listen [::]:80;

    # Замените на ваш домен или IP адрес
    server_name your-domain.com www.your-domain.com your-server-ip;

    # Корневая директория проекта
    root /home/deploy/poa;
    index index.html;

    # Логи
    access_log /var/log/nginx/poa_access.log;
    error_log /var/log/nginx/poa_error.log;

    # Основная локация
    location / {
        try_files $uri $uri/ =404;

        # Добавляем заголовки безопасности
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }

    # Кэширование статических файлов
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Специальная обработка для аудио файлов
    location ~* \.(mp3|wav|ogg)$ {
        expires 1M;
        add_header Cache-Control "public";
        add_header Access-Control-Allow-Origin "*";
        access_log off;
    }

    # Запрет доступа к скрытым файлам
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Запрет доступа к системным файлам
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Обработка больших файлов
    client_max_body_size 50M;
}
```

### 2. Активация конфигурации
```bash
# Создаем символическую ссылку для активации сайта
sudo ln -sf /etc/nginx/sites-available/poa /etc/nginx/sites-enabled/

# Удаляем дефолтную конфигурацию (опционально)
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем синтаксис конфигурации
sudo nginx -t

# Если все ОК, перезапускаем Nginx
sudo systemctl reload nginx
```

### 3. Проверка работы сайта
```bash
# Проверяем доступность сайта
curl -I http://your-server-ip

# Или с доменом
curl -I http://your-domain.com
```

## 🔒 SSL сертификат (Let's Encrypt)

### 1. Установка Certbot
```bash
# Устанавливаем Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Получение SSL сертификата
```bash
# Замените на ваш домен
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Следуйте инструкциям:
# 1. Введите email для уведомлений
# 2. Согласитесь с условиями (A)
# 3. Выберите, делиться ли email с EFF (Y/N)
# 4. Выберите редирект с HTTP на HTTPS (2 - рекомендуется)
```

### 3. Автообновление сертификата
```bash
# Проверяем автообновление
sudo certbot renew --dry-run

# Если все ОК, добавляем в cron для автообновления
sudo crontab -e

# Добавляем строку (выберите удобное время):
0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Проверка HTTPS
```bash
# Проверяем HTTPS соединение
curl -I https://your-domain.com
```

## ✅ Финальная проверка

### 1. Проверка всех служб
```bash
# Проверяем статус Nginx
sudo systemctl status nginx

# Проверяем логи на ошибки
sudo tail -f /var/log/nginx/poa_error.log
```

### 2. Тестирование игры
Откройте браузер и перейдите на:
- `http://your-server-ip` или `https://your-domain.com`
- Проверьте, что:
  - ✅ Главная страница загружается
  - ✅ Изображения отображаются
  - ✅ Звуки воспроизводятся
  - ✅ Игра запускается
  - ✅ Турнирное лобби работает

### 3. Проверка производительности
```bash
# Проверяем использование ресурсов
htop

# Проверяем место на диске
df -h

# Проверяем открытые порты
sudo netstat -tulpn | grep nginx
```

## 🔧 Обслуживание

### Обновление игры
```bash
# Переходим в директорию проекта
cd /home/deploy/poa

# Создаем бэкап текущей версии
sudo tar -czf ~/poa_backup_$(date +%Y%m%d_%H%M%S).tar.gz /home/deploy/poa

# Получаем обновления
git pull origin main

# Устанавливаем права
sudo chown -R www-data:www-data /home/deploy/poa
sudo chmod -R 755 /home/deploy/poa

# Перезапускаем Nginx (если нужно)
sudo systemctl reload nginx
```

### Мониторинг логов
```bash
# Логи доступа
sudo tail -f /var/log/nginx/poa_access.log

# Логи ошибок
sudo tail -f /var/log/nginx/poa_error.log

# Системные логи Nginx
sudo journalctl -u nginx -f
```

### Бэкап
```bash
# Создание полного бэкапа
sudo tar -czf ~/full_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    /home/deploy/poa \
    /etc/nginx/sites-available/poa \
    /etc/letsencrypt

# Автоматический бэкап (добавить в cron)
0 2 * * 0 tar -czf ~/poa_weekly_backup_$(date +\%Y\%m\%d).tar.gz /home/deploy/poa
```

## 🆘 Устранение неполадок

### Игра не загружается
```bash
# Проверяем логи Nginx
sudo tail -n 50 /var/log/nginx/poa_error.log

# Проверяем права доступа
ls -la /home/deploy/poa/

# Проверяем конфигурацию Nginx
sudo nginx -t
```

### Звуки не воспроизводятся
```bash
# Проверяем наличие звуковых файлов
ls -la /home/deploy/poa/sounds/

# Проверяем права на звуковые файлы
sudo find /home/deploy/poa/sounds -name "*.mp3" -o -name "*.wav" | xargs ls -la
```

### SSL проблемы
```bash
# Проверяем статус сертификата
sudo certbot certificates

# Проверяем обновление сертификата
sudo certbot renew --dry-run
```

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи: `/var/log/nginx/poa_error.log`
2. Убедитесь, что все службы запущены: `sudo systemctl status nginx`
3. Проверьте права доступа к файлам: `ls -la /home/deploy/poa/`
4. Убедитесь, что порты открыты: `sudo netstat -tulpn | grep -E ':80|:443'`

---

🎮 **Поздравляем! Игра Pharos Invaders успешно развернута на вашем сервере!**

Теперь игроки могут наслаждаться игрой по адресу вашего домена или IP адреса.