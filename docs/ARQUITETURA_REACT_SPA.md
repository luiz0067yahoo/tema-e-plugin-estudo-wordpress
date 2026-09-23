# ⚛️ Arquitetura do Tema React SPA (`tema_estudo`)

Este documento detalha o funcionamento, arquitetura interna e ciclo de build do **Tema Estudo**, uma Single Page Application (SPA) construída com **React 18**, **Vite** e **React Router v6**, integrada de forma híbrida ao **WordPress** e à REST API do **`plugin_estudo`**.

---

## 📌 1. Visão Geral da Arquitetura

O tema opera no modelo **Headless / SPA Shell Híbrida**:

```text
Navegador do Usuário
       │
       ▼
WordPress (PHP Shell)
├── header.php (wp_head(), estilos compilados, metadados)
├── index.php (<div id="root"></div>)
└── footer.php (wp_footer(), bundle JS injetado com EstudoApiConfig)
       │
       ▼
Bundle React (assets/dist/app.js)
├── main.jsx (Monta a aplicação no #root com BrowserRouter)
├── App.jsx (Header, Navbar, Footer, AuthModal, Rotas e Customizer)
├── AuthContext.jsx (Estado global de login, tokens JWT e usuário)
└── Services/api.js (Consumo dos endpoints REST /wp-json/api/v1/)
```

1. **WordPress como Provedor e Casca:** O WordPress entrega o HTML inicial via `header.php`, `index.php` e `footer.php`. O arquivo `functions.php` enfileira os scripts compilados e injeta o objeto global `window.EstudoApiConfig` contendo rotas REST, nonces de segurança e configurações do Customizer.
2. **React como Engine de Renderização:** O script React localiza o container `<div id="root"></div>` e assume o controle completo da interface do usuário (UI), roteamento e gerenciamento de estado.

---

## 📂 2. Estrutura de Diretórios (`wp-content/themes/tema_estudo`)

```text
tema_estudo/
├── assets/
│   ├── dist/                 # Arquivos compilados para produção
│   │   ├── app.js            # Bundle JavaScript React (Vite)
│   │   └── app.css           # Estilos unificados compilados
│   └── js/                   # Scripts legados / utilitários complementares
├── scripts/
│   └── create-zip.js         # Script Node.js de empacotamento automático do zip
├── src/                      # Código-fonte da aplicação React
│   ├── components/           # Componentes reutilizáveis
│   │   ├── AuthModal.jsx     # Modal de Login / Registro / JWT
│   │   ├── CategoryBanner.jsx# Banner de destaque de categoria
│   │   ├── Footer.jsx        # Rodapé dinâmico da SPA
│   │   ├── Header.jsx        # Barra superior com branding e busca
│   │   ├── Navbar.jsx        # Menu de navegação por categorias
│   │   ├── NavbarCustomizer.jsx # Painel flutuante de personalização em tempo real
│   │   └── PostCard.jsx      # Card de exibição de artigos/produtos no grid
│   ├── context/
│   │   └── AuthContext.jsx   # Contexto React de autenticação (JWT)
│   ├── pages/                # Páginas e visões da SPA
│   │   ├── FeedPage.jsx      # Feed inicial e listagem de categorias
│   │   ├── SingleItemPage.jsx# Exibição individual de post ou produto
│   │   └── NotFoundPage.jsx  # Tela 404 customizada
│   ├── services/
│   │   └── api.js            # Cliente Axios/Fetch para a API REST (/api/v1)
│   ├── App.jsx               # Componente raiz da aplicação
│   ├── index.css             # Folha de estilo global e temas visuais
│   └── main.jsx              # Ponto de entrada (DOM Mount no #root)
├── functions.php             # Enqueue, injeção de dados (wp_localize_script) e Customizer
├── index.php                 # Casca principal da SPA (<div id="root"></div>)
├── header.php / footer.php   # Estrutura base HTML e ganchos wp_head() / wp_footer()
├── page.php / single.php     # Redirecionam requisições para a casca index.php
├── archive.php / category.php# Redirecionam requisições para a casca index.php
├── 404.php                   # Redireciona requisições para a casca index.php
├── package.json              # Dependências e scripts de build
├── style.css                 # Metadados do tema para o WordPress
├── theme.json                # Presets de cores e tipografia para o Gutenberg
└── vite.config.js            # Configuração do Vite para build em assets/dist/
```

---

## ⚡ 3. Pipeline de Build e Geração Automática do `.zip`

O tema foi configurado para compilar os assets do React e gerar automaticamente o pacote de instalação do WordPress **em um único comando**:

### Comandos Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento do Vite com Hot Module Replacement (HMR). |
| `npm run build` | **1.** Compila o React para `assets/dist/app.js` e `app.css`.<br>**2.** Executa automaticamente o hook `postbuild` (`node scripts/create-zip.js`), gerando o arquivo `tema_estudo.zip` otimizado. |
| `npm run preview` | Permite pré-visualizar a build de produção localmente. |

### Como o Empacotamento Funciona (`scripts/create-zip.js`):
- O script filtra dependências pesadas (`node_modules/`, arquivos de desenvolvimento `.git`, `src/`, `vite.config.js`).
- Compacta com nível máximo (`zlib level: 9`), reduzindo o tamanho do tema de **~14,4 MB para apenas ~653 KB**.
- Utiliza barras normais (`/`) para garantir descompactação 100% compatível em servidores Linux e hospedagens de WordPress.
- Salva o arquivo pronto para envio em:
  `wp-content/themes/tema_estudo.zip`

---

## 🌐 4. Comunicação entre WordPress e React

O arquivo `functions.php` expõe os metadados do site para o JavaScript global através de `wp_localize_script`:

```javascript
window.EstudoApiConfig = {
  apiUrl: "https://seu-dominio.com/wp-json/api/v1/",
  wpRestUrl: "https://seu-dominio.com/wp-json/",
  nonce: "abc123xyz",
  siteName: "Nome do Site",
  description: "Descrição",
  homeUrl: "https://seu-dominio.com/",
  navbar: {
    style: "pill", // 'pill', 'underline', 'glass', 'minimal'
    align: "left", // 'left', 'center', 'right'
    sticky: true,
    showCounts: true,
    accent: "#6366f1"
  }
};
```

O cliente `src/services/api.js` consome automaticamente esses valores, garantindo que o tema funcione perfeitamente tanto na raiz do domínio quanto em subdiretórios (ex: `/home/` ou `/wordpress/`).

---

## 🔐 5. Autenticação JWT e Estado Global

- **Contexto (`AuthContext.jsx`):** Mantém o estado de `user`, `token` e `isAuthenticated`.
- **Persistência Local:** O token JWT é armazenado em `localStorage.getItem('estudo_jwt_token')`.
- **Validação de Token:** Ao carregar a aplicação, é feita uma chamada automática a `/wp-json/api/v1/verify` para validar a expiração e autenticidade da sessão.
- **Modal Integrado (`AuthModal.jsx`):** Permite login imediato via interface React sem recarregar a página.

---

## 🎨 6. Customização Dinâmica da Navbar

O tema possui personalização em duas vias:
1. **WordPress Customizer (`Aparência > Personalizar > Personalização da Navbar`):** Define valores padrão no banco de dados WordPress.
2. **Painel Flutuante do Tema (`NavbarCustomizer.jsx`):** Permite que administradores e usuários testem e ajustem estilos (Pill, Underline, Glassmorphism, Minimal), alinhamentos, cor de destaque e comportamento fixo (Sticky) em tempo real.

---

## 📦 7. Histórico dos Templates Legados (FSE)

Versões anteriores do tema continham templates estáticos baseados em blocos (`templates/*.html` e `parts/*.html`). Para permitir a renderização completa da aplicação React via PHP Shell sem colisão no motor de FSE do WordPress, esses arquivos foram arquivados em:

`docs/legacy_fse_templates_backup/`

Caso seja necessário consultar o layout antigo de blocos Gutenberg, todos os arquivos originais encontram-se preservados nesse diretório de documentação.
