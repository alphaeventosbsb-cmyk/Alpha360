# 🛡️ Alpha360 — Monorepo

Plataforma SaaS de gestão de segurança operacional.

## 📁 Estrutura

```
/alpha360
├── /apps
│   ├── /dashboard    → Next.js (painel do contratante)
│   ├── /api          → Express (backend centralizado)
│   └── /pwa          → Vite + React (app do vigilante)
├── /packages
│   └── /shared       → Tipos e utils compartilhados
├── package.json      → Monorepo (npm workspaces)
└── turbo.json        → Turborepo config
```

## 🚀 Como rodar

```bash
# Instalar dependências (raiz)
npm install

# Dashboard (Next.js — porta 3000)
npm run dev

# API backend (Express — porta 3001)
npm run dev:api

# PWA do vigilante (Vite — porta 5173)
npm run dev:pwa
```

## 🏗️ Build

```bash
npm run build        # Dashboard
npm run build:api    # API
npm run build:pwa    # PWA
```

## 🔐 Segurança

- **Frontend → API → Firestore** (zero acesso direto)
- JWT via Firebase Auth validado no middleware
- Multi-tenant: todos dados filtrados por `companyId`

## 📄 Licença

© 2026 Alpha360 — Todos os direitos reservados.
