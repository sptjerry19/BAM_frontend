# Frontend + reverse proxy

**Port 80** = website (Vue)  
**/api** = proxy sang backend (`api` service trên mạng `jb_net`)

## Thứ tự trên EC2

### 1. Backend trước (tạo network `jb_net`, API nội bộ)

```bash
cd /home/ubuntu/BAM_backend
# APP_PORT=8080 trong .env (API debug, không chiếm 80)
docker compose --env-file .env up -d --build
```

Backend nginx đổi tên service thành **`api`**, mặc định publish **8080** (không còn 80).

### 2. Frontend sau (chiếm port 80)

```bash
cd /home/ubuntu/BAM_frontend
git pull

docker compose up -d --build
# hoặc:
# docker build --build-arg VITE_API_URL=/api -t jb-frontend .
# docker run -d --name jb-frontend --network jb_net -p 80:80 jb-frontend
```

Mở Security Group **80**.

- Site: `http://IP/`  
- API: `http://IP/api`  

`VITE_API_URL=/api` (same-origin) — **không** cần IP public lúc build.

## Nếu backend đang chiếm 80

```bash
cd /home/ubuntu/BAM_backend
docker compose --env-file .env down
# đảm bảo .env có APP_PORT=8080
docker compose --env-file .env up -d
cd /home/ubuntu/BAM_frontend
docker compose up -d --build
```
