
```
whatsapp-web-api
├─ nodemon.json
├─ package-lock.json
├─ package.json
├─ src
│  ├─ app.ts
│  ├─ config
│  │  ├─ env.ts
│  │  ├─ logger.ts
│  │  ├─ puppeteer.config.ts
│  │  └─ whatsapp.config.ts
│  ├─ controllers
│  │  ├─ group.controller.ts
│  │  └─ message.controller.ts
│  ├─ interfaces
│  │  ├─ message.interface.ts
│  │  └─ whatsapp.interface.ts
│  ├─ logs
│  ├─ middlewares
│  │  ├─ auth.middleware.ts
│  │  ├─ message.middleware.ts
│  │  └─ morgan.middleware.ts
│  ├─ routes
│  │  ├─ group.routes.ts
│  │  ├─ index.ts
│  │  ├─ message.routes.ts
│  │  └─ whatsapp.routes.ts
│  ├─ server.ts
│  └─ services
│     ├─ bulk-message.service.ts
│     ├─ helpers
│     │  └─ number-checker.ts
│     ├─ managers
│     │  ├─ cleanup-manager.ts
│     │  ├─ client-manager.ts
│     │  └─ event-handler.ts
│     └─ whatsapp.service.ts
└─ tsconfig.json

```