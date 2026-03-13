# BRB Events (Band Portal)

Band portal for BRB Coffee to view and manage event bookings.

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in Firebase credentials
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
4. Navigate to `http://localhost:5174`

## Features

- Band/event planner signup (invitation token optional)
- Band login (email/password)
- View available events
- Create event bookings
- Manage own bookings

## Build

```bash
npm run build
```

## Docker

```bash
docker build -t brb-events .
docker run -p 3002:80 brb-events
```

## HTTPS (Secure Access)

Browser "not secure" warnings happen when the site is served over plain HTTP or with an invalid certificate.

1. Get a valid TLS certificate for your domain (`fullchain.pem` and `privkey.pem`).
2. Mount the certs into the container at `/etc/nginx/certs`.
3. Enable HTTPS mode with `ENABLE_HTTPS=true`.

```bash
docker build -t brb-events .
docker run \
	-p 80:80 -p 443:443 \
	-e ENABLE_HTTPS=true \
	-v /path/to/certs:/etc/nginx/certs:ro \
	brb-events
```

When HTTPS is enabled, HTTP requests are automatically redirected to HTTPS.

