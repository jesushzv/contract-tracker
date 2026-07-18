# Mi Pacto

> **Mi Pacto** es la plataforma de gestión de contratos y cobranza diseñada exclusivamente para freelancers y profesionales independientes en México.

## 🚀 Características Clave

- **Contratos Rápidos**: Genera propuestas y contratos legales basados en plantillas locales (Honorarios, RESICO, etc.).
- **Firma Express**: Envía enlaces de firma directamente por WhatsApp y mantén un registro vinculante de aceptación.
- **Cobros SPEI**: Registra y rastrea tus hitos/anticipos de pago enlazando tu CLABE y verificando claves de rastreo de Banxico (CEP).
- **Personalización**: Define tus plantillas, logotipos y firmas digitales de manera profesional.

## 🛠️ Tecnologías

Este proyecto está construido con:
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Estilos**: Vanilla CSS con soporte de Tailwind CSS v4 para la configuración de temas.
- **Base de Datos / Auth**: Supabase (con soporte local en memoria/cookies para pruebas).
- **Correos**: Resend (envío de notificaciones de contratos y campañas).

## 💻 Desarrollo Local

### Requisitos Previos

Asegúrate de configurar tu entorno con las variables necesarias. Puedes copiar el archivo `.env.example` o `.env.local` si está disponible.

### Iniciar Servidor de Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación local.

### Pruebas

Para correr las pruebas de integración y linter:

```bash
npm run lint
npm run build
```

---

*Desarrollado para la comunidad de freelancers en México.*
