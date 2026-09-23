# Documentação de Arquivos do Projeto WordPress V2

**Repositório:** `tema-e-plugin-estudo-wordpress`  
**Objetivo:** Documentar a estrutura detalhada de diretórios e a função de cada arquivo do ambiente de desenvolvimento integrado WordPress contendo plugin customizado MVC (REST API / JWT) e tema customizado em React 18 SPA (Vite + React Router v6), com pipeline de build e empacotamento automático.

---

## 1. Arquivos da Raiz do Repositório

Configurações globais de controle de versão, servidor local e documentação da raiz.

| Arquivo / Diretório | Tipo | Função e Descrição |
| :--- | :--- | :--- |
| `wp-content/` | **Diretório** | Diretório padrão do WordPress contendo plugins, temas e assets customizados do projeto. |
| `.gitignore` | **Configuração** | Instrui o Git a ignorar dependências (`node_modules/`, `vendor/`), builds (`dist/`) e arquivos locais sensíveis. |
| `.htaccess` | **Servidor** | Configurações do servidor Apache para reescrita de URLs amigáveis (Permalinks) e segurança. |
| `README.md` | **Documentação** | Arquivo principal Markdown contendo visão geral, arquitetura MVC, guia de instalação e rotas REST. |
| `docs/` | **Documentação** | Diretório com guias técnicos aprofundados, documentação de arquitetura React SPA e backups de templates. |

---

## 2. Plugin Customizado: `plugin_estudo`

**Caminho:** `wp-content/plugins/plugin_estudo/`  
Implementa a arquitetura MVC (Models, Views/Controllers), Services e rotas REST customizadas sob o namespace `/api/v1`.

### 2.1. Arquivos da Raiz do Plugin

| Arquivo / Diretório | Tipo | Função e Descrição |
| :--- | :--- | :--- |
| `plugin_estudo.php` | **PHP Principal** | Bootstrap do plugin. Metadados do WordPress, ativação de hooks e inicialização de classes. |
| `config.php` | **Configuração** | Define constantes globais, caminhos absolutos e parâmetros centrais do plugin. |
| `autoload2.php` | **Autoloader** | Gerencia o carregamento dinâmico e modular de classes PHP do plugin. |
| `composer.json` / `.lock` | **Dependências** | Gerenciador de pacotes Composer para controle de bibliotecas externas (ex: Firebase JWT). |
| `env.php` / `.env.example.php` | **Ambiente** | Gerenciamento de variáveis de ambiente e chaves secretas de assinatura JWT. |

### 2.2. Diretório `includes/` (Arquitetura Interna)

| Subpasta / Arquivo | Tipo | Função e Descrição |
| :--- | :--- | :--- |
| `controllers/` | **Controller** | Controladores de rotas e orquestração de requisições, incluindo registro de rotas REST (`_register_rest_route.php`). |
| `controllers/wordpress_api/` | **API Endpoints** | Controladores REST para categorias, posts, produtos, páginas, login e configurações. |
| `db/` | **Banco de Dados** | Gerencia migrações de tabelas customizadas (`_migrate.php`) e operações de dados de login (`user_login_db.php`). |
| `models/` | **Model** | Abstração e mapeamento de dados (categorias, posts, páginas, produtos, usuários e classe base `_model_db.php`). |
| `services/` | **Services** | Camada de regras de negócio intermediária entre controllers e models com validações e formatação de respostas. |

---

## 3. Tema Customizado: `tema_estudo` (React 18 SPA)

**Caminho:** `wp-content/themes/tema_estudo/`  
Single Page Application moderna construída em React 18, Vite e React Router v6. O WordPress atua como casca PHP servindo o container `#root` e injetando configurações via `wp_localize_script`.

### 3.1. Arquivos Core e Casca PHP

| Arquivo / Diretório | Tipo | Função e Descrição |
| :--- | :--- | :--- |
| `index.php` | **React SPA Shell** | Ponto central de montagem HTML da aplicação frontend, contendo o container `<div id="root"></div>`. |
| `functions.php` | **Tema Core** | Enfileira bundles React (`assets/dist/app.js` e `app.css`), injeta `window.EstudoApiConfig` e registra controles no Customizer. |
| `header.php` / `footer.php` | **Estrutura Base** | Abertura HTML, tags de cabeçalho com `wp_head()`, tags de fechamento de corpo e gancho `wp_footer()`. |
| `page.php` / `single.php` | **Encaminhamento** | Requisitam `index.php` para delegar a navegação de páginas e artigos individuais ao React Router. |
| `archive.php` / `category.php` | **Encaminhamento** | Requisitam `index.php` para delegar a navegação de arquivos e categorias ao React Router. |
| `404.php` | **Encaminhamento** | Requisita `index.php` para permitir exibição da página `NotFoundPage` do React. |
| `style.css` | **Metadados** | Cabeçalho exigido pelo WordPress (Nome, Versão 1.0, Autor) e folha de estilos básica de fallback. |
| `theme.json` | **Configuração** | Presets de cores (Dark Navy, Deep Blue, Light Bg) e tipografia para integração com editor WordPress. |

### 3.2. Módulo Frontend React (`src/`)

| Arquivo / Subpasta | Módulo / Camada | Descrição e Responsabilidades |
| :--- | :--- | :--- |
| `src/main.jsx` | **Entrypoint** | Monta a aplicação no elemento DOM `#root` com `BrowserRouter` e `AuthProvider`. |
| `src/App.jsx` | **Componente Raiz** | Estrutura do layout mestre (Header, Navbar, Footer, AuthModal, rotas da aplicação e Customizer). |
| `src/components/Header.jsx` | **Componente** | Barra superior com branding, logotipo dinâmico e botões de ação. |
| `src/components/Navbar.jsx` | **Componente** | Barra de navegação com categorias dinâmicas da API e contadores de itens. |
| `src/components/Footer.jsx` | **Componente** | Rodapé da SPA com créditos e ano dinâmico. |
| `src/components/AuthModal.jsx` | **Componente** | Modal integrado para login de usuários e autenticação JWT via REST API. |
| `src/components/NavbarCustomizer.jsx` | **Componente** | Painel flutuante de personalização visual da barra (Pill, Underline, Glass, Minimal). |
| `src/components/PostCard.jsx` | **Componente** | Card modular de renderização de artigos ou produtos na listagem. |
| `src/pages/FeedPage.jsx` | **Página** | Página principal com feed de postagens e produtos filtrados por categoria. |
| `src/pages/SingleItemPage.jsx` | **Página** | Visualização detalhada individual de post ou produto com galeria e metadados. |
| `src/pages/NotFoundPage.jsx` | **Página** | Tela amigável de erro 404 integrada às rotas do React Router. |
| `src/context/AuthContext.jsx` | **Contexto** | Gerenciamento global de autenticação, armazenamento do token JWT e validação de sessão. |
| `src/services/api.js` | **Serviço REST** | Cliente HTTP para consumo da REST API (`/api/v1`) com tratamento de URLs e credenciais. |
| `src/index.css` | **Estilos SPA** | Sistema de design moderno (Dark theme, glassmorphism, cards interativos e responsividade). |

### 3.3. Pipeline de Build e Empacotamento Automático

| Arquivo / Recurso | Tipo | Função e Descrição |
| :--- | :--- | :--- |
| `vite.config.js` | **Configuração** | Configuração do Vite para compilar `src/main.jsx` em `assets/dist/app.js` e `assets/dist/app.css`. |
| `package.json` | **Dependências / Scripts** | Scripts: `dev` (servidor Vite), `build` (compilação) e `postbuild` (geração automática do `.zip`). |
| `scripts/create-zip.js` | **Script Node.js** | Hook executado após o build que empacota o tema em `tema_estudo.zip` (~653 KB) pronto para o WP. |
| `assets/dist/` | **Build de Produção** | Diretório contendo o bundle final minificado e pronto para servir aos navegadores. |
| `docs/legacy_fse_templates_backup/` | **Backup** | Templates legados de blocos HTML (FSE) arquivados para evitar conflito com a casca React. |
