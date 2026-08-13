# Vue frontend — JBadminton

## Dev

```bash
npm install
npm run dev
```

Mặc định gọi API `http://localhost:8000/api`. Đổi bằng `.env`:

```env
VITE_API_URL=http://localhost/api
```

## Docker (repo FE riêng)

```bash
docker build --build-arg VITE_API_URL=http://YOUR_API_HOST/api -t jb-frontend .
docker run -d -p 80:80 jb-frontend
```
