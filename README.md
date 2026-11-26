# Vue frontend — JBadminton

## Dev

```bash
npm install
npm run dev
```

Vite local gọi API `http://127.0.0.1:8082/api`. Đổi bằng `.env`:

```env
VITE_API_URL=http://127.0.0.1:8082/api
```

## Docker (repo FE riêng)

```bash
docker build --build-arg VITE_API_URL=http://YOUR_API_HOST/api -t jb-frontend .
docker run -d -p 80:80 jb-frontend
```
