# Mi Pacto 🤝

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?style=flat&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

> **Mi Pacto** es una plataforma premium de gestión de contratos y automatización de cobranza diseñada exclusivamente para freelancers y profesionales independientes en México. Simplifica la creación de acuerdos legales, habilita la firma electrónica inmediata y rastrea cobros vía SPEI de manera segura.

---

## 🚀 Características Principales

- **Creador de Contratos Legalmente Alineados**: Plantillas preconfiguradas para esquemas locales comunes en México (Honorarios Profesionales, RESICO, etc.).
- **Firma Express**: Enlace directo para firma digital por WhatsApp o correo electrónico, con registro de huella digital, IP y consentimiento de firma vinculante.
- **Rastreo de Cobros SPEI**: Vinculación de CLABE interbancaria para rastrear anticipos e hitos mediante la verificación de Claves de Rastreo y Comprobantes Electrónicos de Pago (CEP) de Banxico.
- **Panel de Control de Clientes e Insights**: Visualización del estado del pipeline de contratos, analíticas de ingresos y estimaciones fiscales.
- **Centro de Comando Administrativo (`/admin`)**: Administración centralizada de usuarios, análisis de métricas clave del sistema, promociones y seguimiento de campañas.

---

## 📂 Estructura del Proyecto

La estructura principal del repositorio está organizada de la siguiente manera:

```text
├── app/                      # Rutas de Next.js (App Router) y componentes de página
│   ├── admin/                # Panel de control de administración de la plataforma
│   ├── api/                  # Endpoints de API backend (Stripe, Facturapi, Resend, etc.)
│   ├── dashboard/            # Panel de control principal del freelancer
│   └── components/           # Componentes interactivos y componentes del Wizard
├── data/                     # Datos estáticos o mockups para desarrollo local
├── emails/                   # Plantillas de correo electrónico enlazadas con React Email
├── lib/                      # Utilidades compartidas, validadores de RFC y configuraciones
├── scripts/                  # Scripts de utilidades y aprovisionamiento del entorno
│   ├── setup-test-db.js      # Inicialización y siembra de base de datos con verificación de RLS
│   ├── create-admin-user.js  # Herramienta CLI para aprovisionamiento de accesos admin
│   └── test-runner.js        # Orquestador de pruebas unitarias y cálculo de cobertura
├── supabase/                 # Archivos de migración de base de datos y esquemas SQL
└── tests/                    # Suites de pruebas automatizadas
    └── e2e/                  # Pruebas integrales de flujo con Playwright
```

---

## 🛠️ Configuración de Entorno

Para ejecutar la aplicación localmente, debes crear un archivo `.env.local` en la raíz del proyecto. Asegúrate de incluir las siguientes variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
DATABASE_URL=postgresql://postgres:... # URL de conexión directa PostgreSQL para migraciones

# Stripe Integration (Pasarela de pagos)
STRIPE_SECRET_KEY=tu_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=tu_stripe_webhook_secret

# Facturapi Integration (Facturación SAT)
FACTURAPI_API_KEY=tu_facturapi_api_key

# Email Sending (Resend)
RESEND_API_KEY=tu_resend_api_key
```

---

## 💻 Desarrollo Local

### 1. Requisitos Previos

Instala las dependencias del proyecto:

```bash
npm install
```

### 2. Inicializar la Base de Datos y Seed

Para aplicar las migraciones de Supabase en tu entorno y poblar la base de datos con cuentas de prueba persistentes bajo Row Level Security (RLS), ejecuta:

```bash
node scripts/setup-test-db.js
```

> **Cuentas creadas automáticamente**:
> - **Free**: `test-free@example.com`
> - **Starter**: `test-starter@example.com`
> - **Pro**: `test-pro@example.com`
> - **Admin**: `admin@example.com` y `jhector.zamora@hotmail.com` (Acceso completo a `/admin`)

Para más detalles sobre contraseñas y propósitos de pruebas, consulta [test_accounts.md](file:///Users/jhzamora/.gemini/antigravity-ide/scratch/contract-tracker/test_accounts.md) (local).

### 3. Aprovisionamiento de Administrador

Si necesitas aprovisionar un nuevo usuario como administrador de forma manual o promover una cuenta existente, puedes usar:

```bash
node scripts/create-admin-user.js
```

### 4. Ejecutar Servidor de Desarrollo

Inicia el entorno local de Next.js:

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🧪 Pruebas y Validación

La plataforma incluye suites completas de validación de código y pruebas automatizadas:

### Pruebas Unitarias y Cobertura
Las pruebas unitarias corren con el motor nativo de Node.js. Para ejecutarlas y validar el umbral estricto de cobertura de código, usa:

```bash
npm run test
```
*Nota: Se requiere una cobertura mínima de **85%** en líneas y ramas para superar la suite.*

### Pruebas E2E (Playwright)
Para correr las pruebas de integración en navegadores (Headless):

```bash
npx playwright test
```

### Flujo de Validación Local Completo
Antes de realizar commits o subir cambios al repositorio remoto, se recomienda ejecutar el validador local de extremo a extremo que realiza typecheck, linting, compilación, pruebas unitarias y pruebas de integración:

```bash
npm run validate
```

---

*Desarrollado con excelencia para impulsar a los profesionales independientes en México.*
