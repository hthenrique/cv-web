# Curriculo Web - Sistema de Construção e Gestão de Currículo

Aplicação web completa para criar, personalizar, traduzir e exportar seu currículo com persistência em banco de dados **SQLite** local.

Baseado no layout moderno de duas colunas (estilo Enhancv), idêntico ao modelo profissional enviado.

---

## 🚀 Como Executar

### 1. Iniciar o Servidor Fullstack (Recomendado)
Para rodar o backend e o frontend juntos:
```bash
npm start
```
Acesse no seu navegador: **[http://localhost:5000](http://localhost:5000)**

### 2. Modo de Desenvolvimento (Hot Reload)
Se quiser editar o frontend com atualização em tempo real (Vite):
```bash
# Terminal 1 - Backend (Porta 5000)
npm run server

# Terminal 2 - Frontend (Porta 5173 com proxy)
npm run client
```

---

## ✨ Funcionalidades

- 🇧🇷 **Multilíngue (Português & Inglês)**:
  - Alternância com 1 clique entre as versões em **Português** e **Inglês**.
  - Ambas as versões já iniciam pré-preenchidas com os dados profissionais de Henrique Teixeira.
  - Botão de sincronização/cópia entre idiomas.

- 📷 **Foto Personalizada ou Sem Foto**:
  - Por padrão, inicia sem foto (espaço limpo), conforme sua preferência.
  - Upload direto de foto pelo painel de Dados Pessoais ou Cores & Design.
  - Escolha do formato da foto: Círculo, Cantos Arredondados ou Quadrado.
  - Botão para remover a foto e voltar ao estado limpo a qualquer momento.

- 🎨 **Personalização Visual Total**:
  - Seletor de cores da barra lateral, destaques e textos.
  - Presets elegantes prontos (Enhancv Original, Executive Slate, Emerald Corporate, Deep Royal, Burgundy Elegance, Minimal Black).
  - Seleção tipográfica (Inter, Roboto, Poppins, Merriweather).

- 💾 **Persistência Local com SQLite**:
  - Salva todas as edições, temas e fotos no banco de dados local `server/curriculo.db`.
  - Botão "Salvar no SQLite" com confirmação visual.
  - Opção de restaurar os dados originais quando desejar.

- 📄 **Exportação para PDF & Impressão A4**:
  - **Baixar PDF**: Geração direta de arquivo `.pdf` em alta resolução.
  - **Imprimir / Salvar em PDF**: Dispara a caixa de diálogo nativa do navegador com `@media print` milimetricamente calibrada para proporção A4 (sem cortes ou cabeçalhos indesejados).

