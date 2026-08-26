<?php
/**
 * Functions and definitions for Tema Estudo
 * Integrates block-based (FSE) architecture with the REST API from Plugin Estudo.
 *
 * @package TemaEstudo
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * Setup theme features
 */
function tema_estudo_setup() {
	// Add support for Block Templates and FSE features
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'editor-styles' );
	add_theme_support( 'post-thumbnails' );
}
add_action( 'after_setup_theme', 'tema_estudo_setup' );

/**
 * Enqueue scripts and styles, and inject REST API credentials and configuration
 */
function tema_estudo_enqueue_scripts() {
	// Carrega estilos nativos dos blocos Gutenberg do WordPress (incluindo sanfona/details, colunas, etc.)
	wp_enqueue_style( 'wp-block-library' );
	wp_enqueue_style( 'wp-block-library-theme' );

	// Main Theme Stylesheet
	wp_enqueue_style(
		'tema-estudo-style',
		get_stylesheet_uri(),
		array( 'wp-block-library' ),
		'1.0.0'
	);

	// Custom Frontend API Consumer Script (Core)
	wp_enqueue_script(
		'estudo-api-consumer',
		get_template_directory_uri() . '/assets/js/estudo-api.js',
		array(),
		'1.0.0',
		true // Load in footer
	);

	// Inject dynamic variables into front-end JS via wp_localize_script
	wp_localize_script(
		'estudo-api-consumer',
		'EstudoApiConfig',
		array(
			'apiUrl'      => esc_url_raw( rest_url( 'api/v1/' ) ),
			'wpRestUrl'   => esc_url_raw( rest_url() ),
			'nonce'       => wp_create_nonce( 'wp_rest' ),
			'siteName'    => get_bloginfo( 'name' ),
			'description' => get_bloginfo( 'description' ),
			'homeUrl'     => esc_url( home_url( '/' ) ),
		)
	);

	// 1. Arquivo individual para Páginas
	wp_enqueue_script(
		'estudo-page-script',
		get_template_directory_uri() . '/assets/js/page.js',
		array( 'estudo-api-consumer' ),
		'1.0.0',
		true
	);

	// 2. Arquivo individual para Posts (Single Post)
	wp_enqueue_script(
		'estudo-post-script',
		get_template_directory_uri() . '/assets/js/post.js',
		array( 'estudo-api-consumer' ),
		'1.0.0',
		true
	);

	// 3. Arquivo individual para Produtos (Single Product)
	wp_enqueue_script(
		'estudo-product-script',
		get_template_directory_uri() . '/assets/js/product.js',
		array( 'estudo-api-consumer' ),
		'1.0.0',
		true
	);

	// 4. Arquivo individual para Categoria com apenas 1 post ou produto
	wp_enqueue_script(
		'estudo-category-only-script',
		get_template_directory_uri() . '/assets/js/category-only-post-or-product.js',
		array( 'estudo-api-consumer' ),
		'1.0.0',
		true
	);

	// 5. Arquivo individual para Categoria com 1 ou mais posts ou produtos
	wp_enqueue_script(
		'estudo-category-1-plus-script',
		get_template_directory_uri() . '/assets/js/category-1-or-plus-post-or-product.js',
		array( 'estudo-api-consumer', 'estudo-category-only-script' ),
		'1.0.0',
		true
	);
}
add_action( 'wp_enqueue_scripts', 'tema_estudo_enqueue_scripts' );

/**
 * Suporte a regras de reescrita para categorias e posts amigáveis (ex: /home/nome-slug-post-ou-produto)
 */
function tema_estudo_category_rewrite_rules() {
	add_rewrite_rule( '^category/([^/]+)/?$', 'index.php?category_name=$matches[1]', 'top' );
	add_rewrite_rule( '^([^/]+)/([^/]+)/?$', 'index.php?category_name=$matches[1]&name=$matches[2]', 'top' );

	if ( ! get_option( 'tema_estudo_rules_flushed_v3' ) ) {
		flush_rewrite_rules( false );
		update_option( 'tema_estudo_rules_flushed_v3', true );
	}
}
add_action( 'init', 'tema_estudo_category_rewrite_rules' );

/**
 * Obtém o slug da primeira categoria cadastrada no banco de dados.
 *
 * @return string|null Slug da primeira categoria ou null se não existir.
 */
function tema_estudo_get_first_category_slug() {
	$args = array(
		'taxonomy'   => 'category',
		'hide_empty' => false,
		'orderby'    => 'id',
		'order'      => 'ASC',
		'number'     => 1,
	);

	// Tenta desconsiderar a categoria padrao "Sem categoria" / "uncategorized" se houver outras
	$uncategorized = get_term_by( 'name', 'Sem categoria', 'category' );
	if ( ! $uncategorized ) {
		$uncategorized = get_term_by( 'slug', 'uncategorized', 'category' );
	}

	if ( $uncategorized && ! is_wp_error( $uncategorized ) ) {
		$args['exclude'] = array( $uncategorized->term_id );
	}

	$categories = get_terms( $args );

	// Se não houver outras categorias customizadas, busca qualquer categoria
	if ( empty( $categories ) || is_wp_error( $categories ) ) {
		unset( $args['exclude'] );
		$categories = get_terms( $args );
	}

	if ( ! empty( $categories ) && ! is_wp_error( $categories ) ) {
		$first_category = reset( $categories );
		return $first_category->slug;
	}

	return null;
}

/**
 * Redireciona a página inicial (/) ou (/home) para o slug da primeira categoria cadastrada no banco de dados.
 */
function tema_estudo_redirect_home_to_first_category() {
	// Não executa redirecionamento no painel administrativo, requisições AJAX ou endpoints da API REST
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}

	$home_path = trim( parse_url( home_url(), PHP_URL_PATH ) ?? '', '/' );
	$request_path = trim( parse_url( $_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH ), '/' );

	if ( $home_path && strpos( $request_path, $home_path ) === 0 ) {
		$relative_path = trim( substr( $request_path, strlen( $home_path ) ), '/' );
	} else {
		$relative_path = $request_path;
	}

	// Redireciona APENAS se a requisição for estritamente para a raiz '/' ou '/home'
	if ( $relative_path === '' || $relative_path === 'home' ) {
		$first_category_slug = tema_estudo_get_first_category_slug();

		if ( $first_category_slug && $relative_path !== $first_category_slug ) {
			wp_redirect( home_url( '/' . $first_category_slug ), 302 );
			exit;
		}
	}
}
add_action( 'template_redirect', 'tema_estudo_redirect_home_to_first_category' );



