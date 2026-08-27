# Tema e Plugin Estudo WordPress - API REST e Arquitetura MVC

Este repositório contém a documentação e a implementação de um ambiente de desenvolvimento completo em **WordPress**, integrando um **Plugin Customizado (`plugin_estudo`)** construído sobre a arquitetura **MVC (Model-View-Controller)** com suporte a **API REST customizada**, e um **Tema Customizado (`tema_estudo`)** integrado via chamadas assíncronas em JavaScript modular e suporte a Full Site Editing (FSE).

---

## 📋 Sumário
1. [Visão Geral do Projeto](#-visão-geral-do-projeto)
2. [Arquivos da Raiz do Repositório](#1-arquivos-da-raiz-do-repositório)
3. [Plugin Customizado: `plugin_estudo`](#2-plugin-customizado-plugin_estudo)
   - [Arquivos Raiz do Plugin](#21-arquivos-raiz-do-plugin)
   - [Arquitetura Interna (`includes/`)](#22-diretório-includes-arquitetura-interna)
   - [Endpoints da API REST (`api/v1`)](#23-endpoints-da-api-rest-apiv1)
4. [Tema Customizado: `tema_estudo`](#3-tema-customizado-tema_estudo)
   - [Arquivos Core e Templates PHP/HTML](#31-arquivos-core-e-templates-phphtml)
   - [Módulo de Scripts JavaScript (`assets/js/`)](#32-módulo-de-scripts-javascript-assetsjs)
5. [Instalação e Configuração](#-4-instalação-e-configuração)

---

## 🚀 Visão Geral do Projeto

O objetivo deste projeto é demonstrar a estruturação de uma aplicação moderna no WordPress separando claramente as responsabilidades:
- **Camada de Dados (Model & DB)**: Abstração de queries customizadas no banco de dados WordPress e migrações próprias.
- **Camada de Negócio (Services)**: Validações, tratamento de payloads e regras intermediárias da aplicação.
- **Camada de Apresentação e Contrato (Controllers & REST API)**: Disponibilização de rotas REST seguras sob o namespace `api/v1` com suporte a autenticação por Token JWT.
- **Camada Visual e Scripts Assíncronos (Tema)**: Interface frontend responsiva com suporte a blocos Gutenberg/FSE e consumo dinâmico e modular da API REST via arquitetura JavaScript organizada.

---

## 1. Arquivos da Raiz do Repositório

Configurações globais de controle de versão, ambiente do servidor local e documentação do projeto.

| Arquivo / Diretório | Tipo | Função e Descrição |
| :--- | :--- | :--- |
| `wp-content/` | **Diretório** | Diretório padrão do WordPress contendo todos os temas, plugins, uploads e conteúdos customizados do projeto. |
| `.gitignore` | **Configuração** | Lista arquivos e pastas (como dependências do Composer `vendor/` ou credenciais sensíveis `.env`) a serem ignorados pelo Git. |
| `.htaccess` | **Servidor** | Arquivo de configuração do servidor Apache/IIS responsável por regras de reescrita de URL (Permalinks) e segurança. |
| `arquivos.txt` / `lista...` | **Logs / Auxiliar** | Arquivos utilitários locais de anotações e listagens de diretórios. |
| `README.md` | **Documentação** | Arquivo principal Markdown contendo a introdução, tabelas explicativas, arquitetura do projeto e guia de uso. |

---

## 2. Plugin Customizado: `plugin_estudo`

Localizado em `wp-content/plugins/plugin_estudo`, este plugin implementa uma arquitetura modular baseada em serviços, modelos, controladores e integração com banco de dados próprio e API REST.

### 2.1. Arquivos Raiz do Plugin

| Arquivo / Diretório | Tipo | Função e Descrição |
| :--- | :--- | :--- |
| `plugin_estudo.php` | **PHP Principal** | Arquivo principal do plugin. Contém o cabeçalho de metadados exigido pelo WordPress e inicializa o carregamento das classes. |
| `config.php` | **Configuração** | Define constantes globais e parâmetros de configuração do plugin. |
| `autoload2.php` | **Autoloader** | Gerencia o carregamento automático de classes PHP do plugin de forma modular. |
| `composer.json` / `composer.lock` | **Dependências** | Gerenciador de pacotes Composer para controle de bibliotecas e dependências externas (ex: Firebase JWT). |
| `env.php` / `.env.example.php` | **Ambiente** | Gerenciamento de variáveis de ambiente e chaves de configuração sensíveis. |

### 2.2. Diretório `includes/` (Arquitetura Interna)

A pasta `includes/` organiza o código do plugin segundo o padrão de arquitetura em camadas (MVC + Services + DB):

| Subpasta / Arquivo | Tipo | Função e Descrição |
| :--- | :--- | :--- |
| `controllers/` | **Controller** | Controladores de rotas e lógica de requisições, incluindo a inicialização de rotas em `_register_rest_route.php`. |
| `controllers/wordpress_api/` | **API Endpoints** | Controladores específicos para endpoints REST: `categories_controller.php`, `products_controller.php`, `posts_controller.php`, `pages_controller.php`, `settings_controller.php`, `login_api_controller.php`. |
| `db/` | **Banco de Dados** | Gerencia migrações (`_migrate.php`) e operações de tabelas de banco de dados personalizadas (ex: `user_login_db.php`). |
| `models/` | **Model** | Camada de abstração de dados e mapeamento: `wp_categories_model.php`, `wp_users_model.php`, `wp_posts_data_model.php`, `wp_pages_model.php`, `wp_products_model.php`, `_model_db.php`. |
| `services/` | **Services** | Camada de regras de negócios intermediária entre os controllers e modelos (`categories_service.php`, `products_service.php`, `login_api_service.php`, `pages_service.php`, `posts_service.php`, `settings_service.php`). |

### 2.3. Endpoints da API REST (`api/v1`)

| Endpoint | Método HTTP | Controlador | Descrição |
| :--- | :--- | :--- | :--- |
| `/wp-json/api/v1/categories` | `GET` | `CategoriesController` | Retorna a listagem de categorias com suporte a paginação e parâmetros. |
| `/wp-json/api/v1/categories/{id}` | `GET` | `CategoriesController` | Retorna os dados detalhados de uma categoria por ID. |
| `/wp-json/api/v1/products` | `GET` | `ProductsController` | Retorna a listagem de produtos com paginação. |
| `/wp-json/api/v1/products/{id}` | `GET` | `ProductsController` | Retorna os detalhes de um produto específico por ID. |
| `/wp-json/api/v1/posts` | `GET` | `PostsController` | Retorna posts cadastrados no WordPress via API REST. |
| `/wp-json/api/v1/pages` | `GET` | `PagesController` | Retorna páginas cadastradas no WordPress. |
| `/wp-json/api/v1/settings` | `GET` / `POST` | `SettingsController` | Gerencia configurações gerais da API e do plugin. |
| `/wp-json/api/v1/login` | `POST` | `LoginApiController` | Autentica o usuário e gera o token de acesso (JWT). |
| `/wp-json/api/v1/logout` | `POST` | `LoginApiController` | Encerra a sessão do usuário autenticado. |
| `/wp-json/api/v1/new_token` | `POST` | `LoginApiController` | Gera/renova o token JWT de acesso. |
| `/wp-json/api/v1/verify` | `POST` | `LoginApiController` | Valida a autenticidade e validade do token JWT. |

---

## 3. Tema Customizado: `tema_estudo`

Localizado em `wp-content/themes/tema_estudo`, este tema estruturado segue padrões modernos do WordPress com suporte a templates de blocos, assets dedicados e integração assíncrona modular com a API REST do plugin.

### 3.1. Arquivos Core e Templates PHP/HTML

| Arquivo / Diretório | Tipo | Função e Descrição |
| :--- | :--- | :--- |
| `functions.php` | **Tema Core** | Arquivo de funções do tema. Registra suportes do tema, menus, enqueue de scripts/estilos e hooks. |
| `style.css` | **Estilos** | Folha de estilos principal contendo os metadados do tema (Nome, Autor, Versão) e estilos visuais do layout. |
| `header.php` / `footer.php` | **Template Parts** | Estruturas padrão de cabeçalho e rodapé do tema clássico WordPress. |
| `index.php` / `single.php` / `page.php` | **Templates** | Arquivos de template para exibição da página inicial, posts individuais e páginas estáticas. |
| `archive.php` / `category.php` / `404.php` | **Templates** | Templates específicos para listagens de arquivos, categorias e páginas de erro 404. |
| `theme.json` | **Configuração** | Configurações globais do editor de blocos (Full Site Editing - FSE), paleta de cores, espaçamentos e tipografia. |
| `parts/` & `templates/` | **Blocos HTML** | Partes e templates estruturados em HTML para o sistema de blocos do WordPress. |

### 3.2. Módulo de Scripts JavaScript (`assets/js/`)

Conjunto de scripts modulares client-side encarregados de realizar o consumo da API REST (autenticação JWT, rotas e dados) e a renderização dinâmica e interativa das visões do tema:

| Arquivo JavaScript | Módulo / Função | Descrição Detalhada |
| :--- | :--- | :--- |
| `estudo-api.js` | **Cliente REST & Core Renderer** | Define a classe `EstudoAPIClient` (gerenciamento de JWT, nonces e chamadas AJAX aos endpoints REST), renderiza o menu mobile/hambúrguer, configurações dinâmicas do site, menu de navegação e inclui o motor interativo universal para accordions/sanfonas do Gutenberg/plugins. |
| `category-1-or-plus-post-or-product.js` | **Visão Categoria Feed/Grid** | Gerencia a exibição da listagem/grid de categorias contendo 1 ou mais artigos/produtos. Processa o cabeçalho/banner da categoria, formata preços, atende a rotas amigáveis (`/{categoria}/{slug}`) e delega para a visualização single quando necessário. |
| `category-only-post-or-product.js` | **Visão Categoria Única** | Script dedicado para categorias que possuem exatamente 1 post ou produto. Renderiza o conteúdo completo e detalhado do item diretamente na página da categoria. |
| `post.js` | **Visão Individual de Posts** | Controla a requisição e renderização completa de artigos (Post Single). Resolve parâmetros de rota amigável ou de consulta (`?post_id=X`) e atualiza dinamicamente o histórico da URL via `history.replaceState`. |
| `product.js` | **Visão Individual de Produtos** | Gerencia a exibição detalhada de produtos customizados, incluindo galeria de imagens, SKU, status de estoque, cálculo/exibição de preços normais e promocionais e botões de ação de compra. |
| `page.js` | **Visão Páginas Estáticas** | Responsável pela identificação de rotas por slug ou ID (`?page_id=X`) e pela renderização dinâmica do conteúdo das páginas do WordPress. |

---

## 🛠️ 4. Instalação e Configuração

1. **Clonar o Repositório**:
   ```bash
   git clone [https://github.com/luiz0067yahoo/tema-e-plugin-estudo-wordpress.git](https://github.com/luiz0067yahoo/tema-e-plugin-estudo-wordpress.git)
