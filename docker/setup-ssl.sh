#!/usr/bin/env bash
# Run on EC2 once domain DNS points to this instance.
# Domain: jbam.id.vn | Email: duylinhvnu@gmail.com
set -euo pipefail

DOMAIN="jbam.id.vn"
EMAIL="duylinhvnu@gmail.com"
FE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Installing certbot (if needed)"
if ! command -v certbot >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y certbot
fi

echo "==> Stopping frontend (free port 80 for standalone challenge)"
cd "$FE_DIR"
docker compose stop web 2>/dev/null || true
docker compose -f docker-compose.http.yml stop web 2>/dev/null || true

echo "==> Requesting Let's Encrypt certificate for ${DOMAIN}"
sudo certbot certonly --standalone \
  -d "$DOMAIN" \
  -d "www.${DOMAIN}" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --keep-until-expiring

echo "==> Preparing ACME webroot"
sudo mkdir -p /var/www/certbot

echo "==> Starting frontend with SSL (ports 80 + 443)"
cd "$FE_DIR"
docker compose up -d --build

echo "==> Done. Check:"
echo "    https://${DOMAIN}/"
echo "    https://${DOMAIN}/api"
echo ""
echo "Renewal cron (optional):"
echo "    0 3 * * * certbot renew --quiet --deploy-hook 'cd ${FE_DIR} && docker compose exec -T web nginx -s reload'"
