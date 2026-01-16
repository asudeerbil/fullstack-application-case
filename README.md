# Todo Application

This project is a fullstack case study built with Laravel, Inertia.js, React and Docker.

---

## Setup

The application runs inside Docker containers.

```bash
docker compose up -d
docker exec -it laravel_app npm run dev
docker exec -it laravel_app php artisan serve --host=0.0.0.0
