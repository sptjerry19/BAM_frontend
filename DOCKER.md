# Frontend + reverse proxy + SSL (jbam.id.vn)

**Port 80** → redirect HTTPS (+ ACME challenge)  
**Port 443** → website (Vue) + proxy `/api` → backend (`api` trên `jb_net`)

Domain: **https://jbam.id.vn**

## Thứ tự trên EC2

### 1. Backend trước

```bash
cd /home/ubuntu/BAM_backend
# .env: APP_PORT=8080  và  APP_URL=https://jbam.id.vn
docker compose --env-file .env up -d --build --remove-orphans
```

### 2. DNS + Security Group

- A record `jbam.id.vn` (và `www`) → Public IP EC2  
- Inbound SG: **80**, **443**, **22**

### 3. SSL (Let's Encrypt) — chạy 1 lần

```bash
cd /home/ubuntu/BAM_frontend
git pull
chmod +x docker/setup-ssl.sh
sudo mkdir -p /var/www/certbot
bash docker/setup-ssl.sh
```

Email dùng trong script: `duylinhvnu@gmail.com`.

Script sẽ: xin cert → `docker compose up -d --build` (80 + 443).

### 4. Kiểm tra

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
curl -I https://jbam.id.vn
curl -I https://jbam.id.vn/api
```

- Site: https://jbam.id.vn/  
- API: https://jbam.id.vn/api  

`VITE_API_URL=/api` (same-origin) — không cần IP lúc build.

### 5. Gia hạn cert (cron)

```bash
sudo crontab -e
```

```cron
0 3 * * * certbot renew --quiet --deploy-hook "cd /home/ubuntu/BAM_frontend && docker compose exec -T web nginx -s reload"
```

Nếu renew cần port 80 trống (standalone):

```cron
0 3 * * * certbot renew --quiet --pre-hook "cd /home/ubuntu/BAM_frontend && docker compose stop" --post-hook "cd /home/ubuntu/BAM_frontend && docker compose start"
```

## Local (không SSL)

```bash
docker compose -f docker-compose.http.yml up -d --build
```

## Nếu backend đang chiếm 80

```bash
cd /home/ubuntu/BAM_backend
# .env: APP_PORT=8080
docker compose --env-file .env up -d --remove-orphans
cd /home/ubuntu/BAM_frontend
bash docker/setup-ssl.sh
```
