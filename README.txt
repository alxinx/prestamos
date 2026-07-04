================================================================================
  GOTAPAY — GUÍA DE DESPLIEGUE EN SERVIDOR
  Leer antes de llevar a producción
================================================================================


1. REQUISITOS DE INFRAESTRUCTURA
─────────────────────────────────

  Node.js    >= 20 LTS
  MySQL      8.0  (AWS RDS recomendado — misma instancia que Ritma y Grupo GH)
  Redis      7    (AWS ElastiCache recomendado)
  Almacenamiento de archivos: Cloudflare R2


2. VARIABLES DE ENTORNO
─────────────────────────────────────────────────────────────────────────────
  Copiar .env.example como .env y completar TODOS los campos.
  El archivo .env NUNCA se sube al repositorio ni se comparte.

  Valores críticos para producción:

  NODE_ENV=production
  APP_URL=https://tudominio.com         (con https, sin barra al final)
  APP_DOMAIN=tudominio.com

  COOKIE_SECURE=true                    (requiere HTTPS)
  COOKIE_SAME_SITE=strict

  DB_SSL=true                           (obligatorio en RDS)
  DATABASE_URL=mysql://USER:PASS@HOST:3306/DB_NAME?ssl=true

  JWT_SECRET=                           (openssl rand -hex 64)
  JWT_REFRESH_SECRET=                   (openssl rand -hex 64, distinto al anterior)
  AES_SECRET_KEY=                       (openssl rand -hex 32)
  META_VERIFY_TOKEN=                    (openssl rand -hex 32)

  JWT_EXPIRES_IN=15m
  JWT_REFRESH_EXPIRES_IN=7d

  BCRYPT_ROUNDS=12                      (mínimo 12 en producción)

  LOG_LEVEL=info
  LOG_FORMAT=combined

  REDIS_TLS=true                        (obligatorio en ElastiCache)
  REDIS_PASSWORD=                       (contraseña del cluster Redis)

  MORA_JOB_ENABLED=true
  NOTIFICACIONES_JOB_ENABLED=true

  LOGIN_MAX_INTENTOS_EMAIL=5            (intentos fallidos antes de bloquear la cuenta por email)
  LOGIN_BLOQUEO_SEGUNDOS=900            (segundos de bloqueo por cuenta — 900 = 15 min)

  RATE_LIMIT_WINDOW_MS=900000           (ventana del rate limiter — 900000 = 15 min)
  RATE_LIMIT_MAX_GLOBAL=300             (máx requests por IP sobre toda la API en la ventana)
  RATE_LIMIT_MAX_AUTH=10                (máx intentos de login por IP en la ventana)
  RATE_LIMIT_MAX_OTP=3                  (máx solicitudes de OTP por IP por hora)

  MAIL_HOST=                            (SES, Resend o similar — NO Mailtrap)
  MAIL_SECURE=true

  PAYMENTS_SANDBOX=false                (cambiar a false en producción)
  SENTRY_DSN=                           (registrar en Sentry para monitoreo de errores)


3. PRIMER DESPLIEGUE — ORDEN DE PASOS
─────────────────────────────────────

  1. Configurar el .env con todos los valores de producción.
  2. Crear la base de datos en RDS: cobranzas_saas (o el nombre definido en DB_NAME).
  3. Aplicar migraciones:
       npx prisma migrate deploy
  4. Ejecutar el seed inicial (solo una vez):
       node prisma/seed.js
     Esto crea los planes base y el master admin con las credenciales del .env.
  5. Levantar la aplicación:
       NODE_ENV=production node index.js
     O con PM2 (recomendado):
       pm2 start index.js --name gotapay
  6. Cambiar la contraseña del master admin en el primer login.


4. PROTECCIÓN CONTRA ATAQUES
─────────────────────────────────────────────────────────────────────────────

  CUBIERTO EN CÓDIGO (no requiere acción adicional):

  - Rate limiting global: 300 req / 15 min por IP sobre toda la API.
    Configurable con RATE_LIMIT_MAX_GLOBAL y RATE_LIMIT_WINDOW_MS.

  - Rate limiting en login: 10 intentos / 15 min por IP.
    Configurable con RATE_LIMIT_MAX_AUTH.

  - Rate limiting en /refresh: 30 req / 15 min por IP (fijo en código).

  - Rate limiting en OTP de firma: 3 req / hora por IP.
    Configurable con RATE_LIMIT_MAX_OTP.

  - Bloqueo por cuenta tras intentos fallidos: después de 5 intentos
    fallidos sobre el mismo email (desde cualquier IP), la cuenta queda
    bloqueada 15 minutos en Redis. El atacante no puede evadir esto
    rotando IPs. El contador se resetea al hacer login exitoso.
    Configurable con LOGIN_MAX_INTENTOS_EMAIL y LOGIN_BLOQUEO_SEGUNDOS.

  - Protección contra enumeración de usuarios (user enumeration):
    El login siempre corre bcrypt aunque el email no exista, y devuelve
    el mismo mensaje y tiempo de respuesta en ambos casos. Un atacante
    no puede distinguir "email inválido" de "contraseña incorrecta".

  - Protección contra inyección SQL: toda la app usa Prisma ORM con
    prepared statements. No hay concatenación de strings SQL en ningún punto.

  - Headers de seguridad HTTP via Helmet (CSP, HSTS, X-Frame-Options, etc.)

  - X-Powered-By deshabilitado (no revela que se usa Express).

  - Cookies httpOnly + secure + sameSite=strict (los JWT no son accesibles
    desde JavaScript del navegador).

  - Body size limitado a 1MB (mitiga ataques de payloads gigantes).

  - Validación de inputs con Zod en backend (independiente del frontend).

  - Aislamiento de tenants por tenantId en JWT — nunca desde el frontend.


  REQUIERE INFRAESTRUCTURA EXTERNA (hacer antes de abrir al público):

  a) DDoS de gran escala (miles de IPs distintas):
     El rate limiter por IP no detiene un ataque distribuido porque cada
     IP individual está por debajo del límite.
     SOLUCIÓN: Poner Cloudflare delante del servidor (plan Free es suficiente
     para comenzar). Activar modo "Under Attack" si hay un ataque activo.
     Alternativa en AWS: AWS WAF + Shield Standard (incluido sin costo adicional
     en instancias EC2/ALB).

  b) Slowloris y ataques de conexión lenta:
     Un atacante puede abrir miles de conexiones TCP lentas y agotar los
     descriptores de archivo del servidor sin enviar requests completos.
     SOLUCIÓN: Configurar timeouts en el servidor HTTP. Si se usa un proxy
     inverso (nginx, Caddy), configurar:
       client_header_timeout 10s;
       client_body_timeout 10s;
       keepalive_timeout 30s;
     Si se expone Node directamente (sin proxy), agregar en index.js:
       server.setTimeout(30000);
       server.headersTimeout = 15000;
       server.requestTimeout = 30000;

  c) Enumeración de tenants / scraping de emails:
     El endpoint GET /api/master-admin/tenants/verificar-email responde si
     un email existe. Está protegido por authMasterAdmin (JWT), por lo que
     solo un usuario autenticado puede consultarlo. Si en el futuro se expone
     sin autenticación (ej. en registro de tenants), agregar rate limiter
     estricto (máx 5 req/hora por IP).

  d) Secretos y claves:
     Nunca poner JWT_SECRET, AES_SECRET_KEY ni ninguna clave en el código,
     en logs, ni en respuestas de API. Rotarlos si hay sospecha de filtración.
     En AWS, usar Secrets Manager o Parameter Store en lugar de archivo .env.


5. PROXY INVERSO (NGINX / CADDY)
─────────────────────────────────

  Se recomienda NO exponer Node.js directamente al puerto 80/443.
  Usar nginx o Caddy como proxy inverso con SSL terminado ahí.

  Caddy (más simple, SSL automático):
    gotapay.tudominio.com {
      reverse_proxy localhost:3000
    }

  Luego actualizar en .env:
    APP_URL=https://gotapay.tudominio.com
    CORS_ORIGIN=https://gotapay.tudominio.com


6. WHITELIST DE IPS PARA EL PANEL MASTER ADMIN
─────────────────────────────────────────────────

  La variable MASTER_ADMIN_IP_WHITELIST acepta un JSON array de IPs:
    MASTER_ADMIN_IP_WHITELIST=["200.x.x.x","190.x.x.x"]

  Agregar únicamente las IPs estáticas desde donde se administrará el panel.
  Si la IP es dinámica, dejar vacío y confiar solo en el JWT + bloqueo por cuenta.


7. BACKUPS Y MONITOREO
─────────────────────────

  - Activar automated backups en RDS (retención mínima 7 días).
  - Activar CloudWatch Alarms para CPU > 80% y conexiones de DB > 80%.
  - Configurar SENTRY_DSN para captura de errores en tiempo real.
  - Monitorear el log de Express con LOG_FORMAT=combined y redirigir a
    un servicio de logs (CloudWatch Logs, Papertrail, Logtail).


8. CHECKLIST ANTES DE ABRIR AL PÚBLICO
─────────────────────────────────────────

  [ ] NODE_ENV=production
  [ ] HTTPS activo y COOKIE_SECURE=true
  [ ] JWT_SECRET y JWT_REFRESH_SECRET generados con openssl rand -hex 64
  [ ] AES_SECRET_KEY generado con openssl rand -hex 32
  [ ] BCRYPT_ROUNDS=12
  [ ] DB_SSL=true
  [ ] REDIS_TLS=true y REDIS_PASSWORD configurado
  [ ] PAYMENTS_SANDBOX=false
  [ ] MAIL_HOST apunta a servicio de producción (no Mailtrap)
  [ ] LOGIN_MAX_INTENTOS_EMAIL y LOGIN_BLOQUEO_SEGUNDOS configurados
  [ ] MASTER_ADMIN_IP_WHITELIST configurado
  [ ] Contraseña del master admin cambiada en el primer login
  [ ] Cloudflare o AWS WAF activo delante del servidor
  [ ] Proxy inverso (Caddy o nginx) con SSL activo
  [ ] Backups automáticos de RDS activados
  [ ] SENTRY_DSN configurado
  [ ] npm audit sin vulnerabilidades críticas o altas
  [ ] .env no está en el repositorio (verificar .gitignore)


================================================================================
