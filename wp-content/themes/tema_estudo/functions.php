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

	// Custom Frontend API Consumer Script
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
}
add_action( 'wp_enqueue_scripts', 'tema_estudo_enqueue_scripts' );

/**
 * Flush rewrite rules on theme activation or support category slug routes
 */
function tema_estudo_category_rewrite_rules() {
	add_rewrite_rule( '^category/([^/]+)/?$', 'index.php?category_name=$matches[1]', 'top' );
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

	$request_uri = trim( parse_url( $_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH ), '/' );

	// Verifica se a requisição é para a página inicial (raiz / ou /home)
	if ( is_front_page() || is_home() || $request_uri === 'home' || $request_uri === '' ) {
		$first_category_slug = tema_estudo_get_first_category_slug();

		if ( $first_category_slug && $request_uri !== $first_category_slug ) {
			wp_redirect( home_url( '/' . $first_category_slug ), 302 );
			exit;
		}
	}
}
add_action( 'template_redirect', 'tema_estudo_redirect_home_to_first_category' );


