# Multi-stage build для оптимизации размера образа
FROM nginx:alpine as production

# Установка необходимых пакетов
RUN apk add --no-cache \
    curl \
    wget \
    git \
    certbot \
    certbot-nginx

# Создание директории для проекта
WORKDIR /var/www/poa

# Копирование файлов проекта
COPY . .

# Удаление ненужных файлов для продакшена
RUN rm -f Dockerfile docker-compose.yml .gitignore .git* \
    && rm -rf .idea/ .vscode/ node_modules/ \
    && rm -f DEPLOYMENT_GUIDE.md README.md

# Установка правильных прав доступа
RUN chown -R nginx:nginx /var/www/poa \
    && chmod -R 755 /var/www/poa \
    && find /var/www/poa -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.gif" -o -name "*.mp3" -o -name "*.wav" \) -exec chmod 644 {} \; \
    && find /var/www/poa -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" \) -exec chmod 644 {} \;

# Копирование конфигурации Nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Создание директорий для логов
RUN mkdir -p /var/log/nginx

# Проверка конфигурации Nginx
RUN nginx -t

# Открытие портов
EXPOSE 80 443

# Healthcheck для мониторинга
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Запуск Nginx
CMD ["nginx", "-g", "daemon off;"]