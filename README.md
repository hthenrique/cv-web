# 📄 Currículo Web - Sistema Profissional de Gestão de Currículos

Aplicação web fullstack moderna para criação, edição, personalização visual, tradução automática (PT/EN) e exportação para PDF de alta fidelidade, com persistência em banco de dados **SQLite** e arquitetura multi-usuário.

Desenvolvido com base no layout elegante de duas colunas (estilo *Enhancv*), pronto para uso local ou publicação em nuvem (Vercel, Render, Railway, etc.).

---

## 🌐 Ambientes em Produção (Vercel)

| Serviço | URL | Descrição |
| :--- | :--- | :--- |
| **Frontend** | [https://cv-web-rho-wine.vercel.app](https://cv-web-rho-wine.vercel.app) | Aplicação web React 19 / Vite |
| **Backend API** | [https://server-mu-sooty.vercel.app](https://server-mu-sooty.vercel.app) | API Node.js / Express com Serverless SQLite |
| **Visualizador do Banco** | [https://server-mu-sooty.vercel.app/api/admin/db-inspect](https://server-mu-sooty.vercel.app/api/admin/db-inspect) | Dashboard visual com dados do SQLite |
| **Download do SQLite** | [https://server-mu-sooty.vercel.app/api/admin/db-download](https://server-mu-sooty.vercel.app/api/admin/db-download) | Download direto do arquivo `curriculo.db` |

---

## ✨ Funcionalidades Principais

### 🔐 Sistema de Autenticação & Multi-Usuário (Isolamento por UUID)
- **Login e Cadastro**: Interface com alternância rápida entre login e cadastro de novas contas.
- **Isolamento Total**: Cada usuário possui seu próprio currículo no SQLite identificado por UUID; nenhum usuário acessa os dados de outro.
- **Sessão Persistente**: Armazenamento seguro de sessão e cache local via `localStorage`.
- **Alteração de Senha**: Modal para troca de senha com validação da senha atual e criptografia `scrypt` com salt aleatório.
- **Usuário Padrão Pré-carregado**:
  - **E-mail:** `ht.henrique@live.com`
  - **Senha:** `123456`

### 🌐 Suporte Multilíngue & Tradução Inteligente (PT / EN)
- **Duas versões independentes**: Alternância entre as versões em **Português** e **Inglês** em 1 clique.
- **Cores e Temas por Idioma**: Cada idioma pode ter sua própria paleta de cores e tipografia personalizadas de forma independente.
- **Sincronização & Tradução Automática**: Botão "Copiar do Português" com suporte a tradução automática para o Inglês de textos, resumos, experiências e termos técnicos via API.

### 📄 Exportação em PDF & Impressão A4 Milimétrica
- **Geração Direta em PDF**: Botão "Baixar PDF" gera o arquivo `.pdf` em alta resolução via `html2canvas` e `jsPDF`.
- **Sangria Total (Full-Bleed)**: Sem bordas brancas indesejadas, com preenchimento completo da coluna esquerda até as bordas.
- **Ícones Perfeitamente Alinhados**: Ícones SVG verticais e horizontais alinhados ao texto nos detalhes de contato.
- **Impressão Nativa**: Suporte a `@media print` calibrado para folha A4 com corte e margens exatas.

### 🎨 Personalização Visual & Fotografia
- **Seletor de Cores Dinâmico**: Controle da cor da barra lateral, destaques e fontes.
- **Presets Profissionais**: Enhancv Original, Executive Slate, Emerald Corporate, Deep Royal, Burgundy Elegance e Minimal Black.
- **Tipografia**: Suporte a fontes Inter, Roboto, Poppins e Merriweather.
- **Foto de Perfil Opcional**: Upload direto no banco de dados (Base64) ou modo limpo (sem foto), com formatos Circular, Arredondado ou Quadrado.

### 💾 Banco de Dados SQLite & Ferramentas Admin
- Armazenamento de usuários, currículos, seções, traduções e fotos via `better-sqlite3`.
- **Painel de Inspeção Web**: Acesse `/api/admin/db-inspect` para visualizar todas as tabelas em HTML ou JSON.
- **Backup / Download**: Acesse `/api/admin/db-download` para baixar o arquivo físico `curriculo.db`.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js** 18+ instalado
- **npm** instalado

### 1. Clonar o Repositório e Instalar Dependências
```bash
git clone git@github.com:hthenrique/cv-web.git
cd curriculo-web

# Instalar dependências da raiz e do servidor
npm install

# Instalar dependências do cliente React
npm --prefix client install
```

### 2. Executar a Aplicação

#### Opção A: Servidor Fullstack Unificado
Inicia o backend Express (que também serve o frontend compilado caso exista):
```bash
npm start
```
Acesse: **[http://localhost:5000](http://localhost:5000)**

#### Opção B: Modo Desenvolvimento (Hot-Reload com Vite)
Recomendado para fazer alterações no código com recarregamento instantâneo:

```bash
# Terminal 1 - Backend (Porta 5000)
npm run server

# Terminal 2 - Frontend Vite (Porta 5173)
npm run client
```
Acesse o frontend em: **[http://localhost:5173](http://localhost:5173)**

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz ou configure as variáveis no painel da Vercel:

| Variável | Onde Usar | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Frontend / Vercel Client | URL base do backend Express | `https://server-mu-sooty.vercel.app/api` |
| `CLIENT_URL` | Backend / Vercel Server | Origem permitida pelo CORS | `https://cv-web-rho-wine.vercel.app` |
| `PORT` | Backend | Porta do servidor Express local | `5000` |
| `HOST` | Backend | Interface de rede para o servidor | `0.0.0.0` |

---

## ☁️ Estrutura de Deploy na Vercel

O repositório é configurado como monorepo com dois projetos na Vercel:

1. **Frontend (`client`)**:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite
   - **Environment Variable:** `VITE_API_URL=https://server-mu-sooty.vercel.app/api`

2. **Backend (`server`)**:
   - **Root Directory:** `server` (ou raiz)
   - **Configuração:** `server/vercel.json` com rewrites para `/api/index.js` e cabeçalhos de CORS pré-configurados no Edge da Vercel.
   - **Environment Variable:** `CLIENT_URL=https://cv-web-rho-wine.vercel.app`

---

## 📁 Estrutura de Pastas

```text
curriculo-web/
├── client/                     # Aplicação Frontend (React 19, Tailwind, Vite)
│   ├── src/
│   │   ├── components/         # Componentes (Resume, Sidebar, Header, Modals, Forms)
│   │   ├── services/           # Integração com API (api.js com suporte a VITE_API_URL)
│   │   ├── utils/              # Exportação de PDF (pdfExport.js), temas e traduções
│   │   ├── App.jsx             # Fluxo principal e controle de autenticação
│   │   └── main.jsx            # Ponto de entrada do React
│   ├── index.html              # Template HTML principal
│   └── vite.config.js          # Configuração do Vite e proxy reverso local
│
├── server/                     # Backend API (Node.js, Express, better-sqlite3)
│   ├── api/
│   │   └── index.js            # Wrapper Serverless Function para Vercel
│   ├── db.js                   # Camada de banco SQLite, schemas, migrations e seeds
│   ├── translator.js           # Mecanismo de tradução automática PT <-> EN
│   ├── vercel.json             # Roteamento e regras de CORS para o backend na Vercel
│   ├── index.js                # Servidor Express, rotas de auth, resume e admin
│   └── package.json            # Dependências do backend
│
├── .env.example                # Modelo de variáveis de ambiente
├── package.json                # Scripts npm da raiz do monorepo
└── README.md                   # Documentação do projeto
```

---

## 📝 Licença & Autor

Desenvolvido por **Henrique Teixeira**.
Distribuído sob a licença **MIT**.
