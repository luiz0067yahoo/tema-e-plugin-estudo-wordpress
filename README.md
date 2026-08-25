# Tema e Plugin Estudo WordPress - API REST e Arquitetura MVC

Este repositório contém a documentação e implementação de um ambiente completo de desenvolvimento em **WordPress**, integrando um **Plugin Customizado (`plugin_estudo`)** construído sobre a arquitetura **MVC (Model-View-Controller)** com suporte a **API REST customizada**, e um **Tema Customizado (`tema_estudo`)** integrado via chamadas assíncronas em JavaScript e suporte a Full Site Editing (FSE).

---

## 📋 Sumário
1. [Visão Geral do Projeto](#-visão-geral-do-projeto)
2. [Arquivos da Raiz do Repositório](#1-arquivos-da-raiz-do-repositório)
3. [Plugin Customizado: `plugin_estudo`](#2-plugin-customizado-plugin_estudo)
   - [Arquivos Raiz do Plugin](#21-arquivos-raiz-do-plugin)
   - [Arquitetura Interna (`includes/`)](#22-diretório-includes-arquitetura-interna)
   - [Endpoints da API REST (`api/v1`)](#23-endpoints-da-api-rest-apiv1)
4. [Tema Customizado: `tema_estudo`](#3-tema-customizado-tema_estudo)
5. [Instalação e Configuração](#-4-instalação-e-configuração)

---

## 🚀 Visão Geral do Projeto

O objetivo deste projeto é demonstrar a estruturação de uma aplicação moderna no WordPress separando claramente as responsabilidades:
- **Camada de Dados (Model & DB)**: Abstração de queries customizadas no banco de dados WordPress e migrações próprias.
- **Camada de Negócio (Services)**: Validações, tratamento de payloads e regras intermediárias da aplicação.
- **Camada de Apresentação e Contrato (Controllers & REST API)**: Disponibilização de rotas REST seguras sob o namespace `api/v1` com suporte a autenticação por Token JWT.
- **Camada Visual (Tema)**: Interface frontend responsiva com suporte a blocos Gutenberg/FSE e integração de dados via JavaScript (`assets/js/estudo-api.js`).

---

## 1. Arquivos da Raiz do Repositório

Configurações globais de controle de versão, ambiente do servidor local e documentação do projeto baseadas nas especificações de `docs/`.

| Arquivo / Diretório | Tipo | Função e Descrição |
| :--- | :--- | :--- |
| `wp-content/` | **Diretório** | Diretório padrão do WordPress contendo todos os temas, plugins, uploads e conteúdos customizados do projeto. |
| `.gitignore` | **Configuração** | Lista arquivos e pastas (como dependências do Composer `vendor/` ou credenciais sensíveis `.env`) a serem ignorados pelo Git. |
| `.htaccess` | **Servidor** | Arquivo de configuração do servidor Apache/IIS responsável por regras de reescrita de URL (PermLinks) e segurança. |
| `docs/` | **Documentação** | Contém a documentação técnica original do projeto em formatos PDF e DOCX (`documentacao_arquivos_wordpress.*`). |
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
| `models/` | **Model** | Camada de abstração de dados e mapeamento: `wp_categories_model.php`, `wp_users_model.php`, `wp_posts_data_model.php`, `wp_pages_model.php`, `wp_products_model.php`, `user_login_model.php`, `_model_db.php`. |
| `services/` | **Services** | Camada de regras de negócios intermediária entre os controllers e models (`_service_api.php`, `categories_service.php`, `products_service.php`, `login_api_service.php`, etc.). |

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

Localizado em `wp-content/themes/tema_estudo`, este tema estruturado segue padrões modernos do WordPress com suporte a templates de blocos, assets dedicados e integração via JavaScript assíncrono com a API REST do plugin.

| Arquivo / Diretório | Tipo | Função e Descrição |
| :--- | :--- | :--- |
| `functions.php` | **Tema Core** | Arquivo de funções do tema. Registra suportes do tema, menus, enqueue de scripts/estilos e configurações centrais. |
| `style.css` | **Estilos** | Folha de estilos principal contendo os metadados do tema (Nome, Autor, Versão) e estilos visuais de layout. |
| `header.php` / `footer.php` | **Template Parts** | Estruturas padrão de cabeçalho e rodapé do tema clássico WordPress. |
| `index.php` / `single.php` / `page.php` | **Templates** | Arquivos de template para exibição da página inicial, posts individuais e páginas estáticas. |
| `archive.php` / `category.php` / `404.php` | **Templates** | Templates específicos para listagens de arquivos, categorias e páginas de erro 404. |
| `theme.json` | **Configuração** | Configurações globais do editor de blocos (Full Site Editing - FSE), paleta de cores e tipografia. |
| `assets/js/estudo-api.js` | **JavaScript** | Script frontend responsável por interagir via requisições assíncronas com os endpoints REST criados no plugin. |
| `parts/` & `templates/` | **Blocos HTML** | Partes e templates estruturados em HTML para o sistema de blocos e blocos reutilizáveis do tema. |

---

## 🛠️ 4. Instalação e Configuração

1. **Clonar o Repositório**:
   ```bash
   git clone https://github.com/luiz0067yahoo/tema-e-plugin-estudo-wordpress.git
   ```

2. **Instalação das Dependências do Plugin**:
   Navegue até a pasta do plugin e execute o Composer:
   ```bash
   cd wp-content/plugins/plugin_estudo
   composer install
   ```

3. **Configuração de Variáveis de Ambiente**:
   Copie o arquivo `.env.example.php` para `env.php` e configure as chaves sensíveis e segredos JWT.

4. **Ativação no WordPress**:
   - Acesse o painel `/wp-admin`.
   - Em **Plugins**, ative o **Plugin Estudo**.
   - Em **Aparência > Temas**, ative o **Tema Estudo**.
   - Certifique-se de que os **Permalinks** do WordPress estejam configurados em uma estrutura amigável (ex: Nome do Post) para o correto funcionamento das rotas REST sob `/wp-json/api/v1/`.