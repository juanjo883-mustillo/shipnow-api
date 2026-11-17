# ShipNow API

API backend profesional para gestionar **usuarios**, **envíos** y **tracking**, con carga de archivos, documentación Swagger, tests funcionales y Docker.

## Tecnologías

Node.js 20 · Express · MongoDB + Mongoose · Winston · Multer · Swagger (swagger-jsdoc + swagger-ui-express) · Mocha + Chai + Supertest · Helmet / CORS / express-rate-limit · Docker + Docker Compose.

## Arquitectura

Arquitectura por capas **Controller → Service → Repository**:

```
src/
├── config/         env.js (único lector de process.env), database.js, swagger.js
├── constants/      estados, transiciones, roles, tipos de archivo, límites
├── errors/         errores personalizados del dominio
├── middlewares/    errorHandler global, notFound, upload (Multer), internalOnly, requestLogger
├── models/         esquemas Mongoose (User, Shipment, subesquema de archivos)
├── repositories/   ÚNICO acceso a MongoDB (junto a models)
├── services/       lógica de negocio (users, shipments, mocks, uploads, health)
├── controllers/    traducen HTTP ⇄ services
├── routes/         definición de rutas + anotaciones Swagger
├── utils/          logger (Winston), validators, helpers
├── app.js          configuración de Express (testeable sin levantar puerto)
└── server.js       arranque, conexión a la base y apagado ordenado
test/               tests funcionales (Mocha, Chai, Supertest)
```

- Las rutas no tocan la base: llaman al controller, este al service y este al repository.
- **Mocks**: `mock.service.js` genera usuarios y envíos coherentes con los modelos usando las constantes del proyecto (el historial de cada envío respeta las transiciones válidas).
- **Errores**: middleware global que devuelve siempre el mismo JSON:
  ```json
  { "status": "error", "error": { "code": "NOT_FOUND", "message": "Usuario no encontrado" } }
  ```
  Errores del dominio: `NOT_FOUND` (404), `INVALID_DATA` (400), `INVALID_STATE` (409), `FILE_REQUIRED` (400), `INVALID_FILE_TYPE` (415), `INVALID_MOCK_QUANTITY` (400), además de `CONFLICT` (409), `FILE_TOO_LARGE` (413) y `UNAUTHORIZED` (401).
- **Estados de un envío**: `created → in_transit → out_for_delivery → delivered` (también `cancelled`; `out_for_delivery` puede volver a `in_transit`). `delivered` y `cancelled` son finales.

## Variables de entorno

Todas se leen en `src/config/env.js`. Ver `.env.example`.

| Variable | Descripción | Por defecto |
|---|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` | `development` |
| `PORT` | Puerto HTTP | `3000` |
| `MONGO_URI` | Conexión a MongoDB | `mongodb://127.0.0.1:27017/shipnow` |
| `MONGO_URI_TEST` | Base **independiente** para tests (el nombre debe incluir `test`) | `mongodb://127.0.0.1:27017/shipnow_test` |
| `LOG_LEVEL` | `error`, `warn`, `info`, `http`, `debug` | `debug` (dev) / `info` (prod) |
| `LOG_DIR` | Carpeta de logs | `logs` |
| `UPLOAD_DIR` | Carpeta de archivos subidos | `uploads` |
| `MAX_FILE_SIZE_MB` | Tamaño máximo por archivo | `5` |
| `CORS_ORIGIN` | Origen permitido por CORS | `*` |
| `RATE_LIMIT_MAX` | Requests por IP cada 15 min | `100` |
| `INTERNAL_API_KEY` | Clave para endpoints internos (**obligatoria en producción**) | — |

## Instalación y ejecución local

Requisitos: Node.js ≥ 18 y una instancia de MongoDB.

```bash
npm install
cp .env.example .env        # ajustá los valores
npm run dev                 # desarrollo con recarga (nodemon)
# o
npm start
```

La API queda en `http://localhost:3000`. Health check: `GET /api/health`.

> Si `INTERNAL_API_KEY` está definida (como en `.env.example`), los endpoints `/api/mocks/*` y `/api/logger/*` exigen el header `x-internal-key: <valor>`. En Swagger UI usá el botón **Authorize**.

Mongo rápido con Docker: `docker run -d -p 27017:27017 --name mongo mongo:7`

## Tests

```bash
npm test
```

Usa Mocha + Chai + Supertest contra la base `MONGO_URI_TEST` (se limpia sola; se rechaza cualquier base cuyo nombre no incluya `test`). Los archivos subidos en los tests van a una carpeta temporal del sistema, por lo que `uploads/` nunca se ensucia. Cubren: flujo completo de un envío, casos exitosos y de error de usuarios/envíos/tracking, mocks, control de endpoints internos, health check, Swagger (incluye verificar que cada ruta documentada existe) y carga de archivos.

## Swagger

Con la API levantada: **http://localhost:3000/api/docs** (JSON de la especificación en `/api/docs.json`).

## Docker

```bash
# Levantar API + MongoDB (la API espera al healthcheck de Mongo)
docker-compose up --build        # o: docker compose up --build

# Opcional: personalizar variables (compose lee .env automáticamente)
INTERNAL_API_KEY=mi-clave-segura docker-compose up --build
```

- `Dockerfile` multi-stage (`node:20-alpine`), usuario no-root y `HEALTHCHECK` sobre `/api/health`.
- `docker-compose.yml` define `mongo` (con healthcheck) y `api` (`depends_on: condition: service_healthy`), con volúmenes para datos, uploads y logs.
- Construir y ejecutar solo la imagen (con un Mongo accesible):
  ```bash
  docker build -t shipnow-api .
  docker run -p 3000:3000 -e MONGO_URI=mongodb://host.docker.internal:27017/shipnow \
    -e INTERNAL_API_KEY=mi-clave shipnow-api
  ```

## Logs

- Winston centralizado en `src/utils/logger.js`, con niveles diferenciados.
- `logs/error.log` → solo errores · `logs/combined.log` → toda la actividad (JSON).
- La **consola solo se usa en `development`**. En producción/Docker leé los archivos: `docker-compose exec api tail -f logs/combined.log`.
- Los `.log` están en `.gitignore`; solo se versiona `logs/.gitkeep`.

## Uploads

- Documentos de usuario: `POST /api/users/:id/documents` (campo `document`).
- Comprobantes de envío: `POST /api/shipments/:id/receipts` (campo `receipt`).
- Permitidos: PDF, JPG y PNG; máximo `MAX_FILE_SIZE_MB`. Además del mimetype se verifica la firma real del archivo.
- Se guardan con nombre generado (UUID) en `uploads/documents/` y `uploads/receipts/`; los metadatos (nombre original, tipo, tamaño, ruta, fecha) quedan en MongoDB.
- Si la operación falla (usuario/envío inexistente, tipo inválido…) el archivo se elimina; al borrar el usuario/envío se borran sus archivos.
- `uploads/` está en `.gitignore` (solo se versiona `.gitkeep`). Los archivos no se sirven públicamente.

## Producción y rendimiento

Variables centralizadas, `.env.example`, health check, límite de body (100 KB) y de archivos, paginación con tope (máx. 50 por página), listados sin `history`/`receipts`, rate limiting, Helmet, errores 500 sin detalles internos y endpoints internos protegidos con `x-internal-key`. Los mocks aceptan como máximo 100 elementos.

## Endpoints principales

Detalle completo, schemas y respuestas de error en **Swagger** (`/api/docs`).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado de la API y la base |
| POST / GET | `/api/users` | Crear / listar (paginado) |
| GET / PUT / DELETE | `/api/users/:id` | Detalle / actualizar / eliminar |
| POST | `/api/users/:id/documents` | Subir documento |
| POST / GET | `/api/shipments` | Crear / listar (filtros `status`, `sender`) |
| GET / PUT / DELETE | `/api/shipments/:id` | Detalle / actualizar / eliminar |
| PATCH | `/api/shipments/:id/status` | Cambiar estado (valida transiciones) |
| POST | `/api/shipments/:id/receipts` | Subir comprobante |
| GET | `/api/shipments/tracking/:trackingCode` | Seguimiento público |
| GET | `/api/mocks/users?quantity=N` | Usuarios simulados (interno) |
| GET | `/api/mocks/shipments?quantity=N` | Envíos simulados (interno) |
| POST | `/api/mocks/generate` | Genera y guarda mocks (interno) |
| GET | `/api/logger/test` | Emite logs de todos los niveles (interno) |

### Ejemplo rápido

```bash
curl -X POST localhost:3000/api/users -H "Content-Type: application/json" \
  -d '{"name":"Ana Pérez","email":"ana@example.com"}'

curl -X POST localhost:3000/api/shipments -H "Content-Type: application/json" \
  -d '{"sender":"<ID_USUARIO>","recipient":{"name":"Luis Gómez","address":"Av. Siempre Viva 742","city":"Rosario"},"weightKg":2.5}'
```
