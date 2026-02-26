# BRB Events (Band Portal)

Band portal for BRB Coffee to view and manage event bookings.

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in Firebase credentials
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
4. Navigate to `http://localhost:5174`

## Features

- Band signup with invitation token
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
