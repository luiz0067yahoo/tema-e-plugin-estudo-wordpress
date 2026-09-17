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
	add_theme_support( 'custom-logo', array(
		'height'      => 100,
		'width'       => 400,
		'flex-height' => true,
		'flex-width'  => true,
	) );
}
add_action( 'after_setup_theme', 'tema_estudo_setup' );

/**
 * Enqueue React SPA scripts and styles, and inject REST API credentials and configuration
 */
function tema_estudo_enqueue_scripts() {
	// Carrega estilos nativos dos blocos Gutenberg do WordPress
	wp_enqueue_style( 'wp-block-library' );
	wp_enqueue_style( 'wp-block-library-theme' );

	$theme_dir = get_template_directory();
	$theme_uri = get_template_directory_uri();

	// 1. Estilos compilados do bundle React
	$css_file = $theme_dir . '/assets/dist/app.css';
	if ( file_exists( $css_file ) ) {
		wp_enqueue_style(
			'tema-estudo-react-style',
			$theme_uri . '/assets/dist/app.css',
			array( 'wp-block-library' ),
			filemtime( $css_file )
		);
	} else {
		// Fallback para estilo básico caso o bundle ainda não tenha sido gerado
		wp_enqueue_style(
			'tema-estudo-style',
			get_stylesheet_uri(),
			array( 'wp-block-library' ),
			'1.0.0'
		);
	}

	// 2. Script compilado do bundle React (SPA com Vite)
	$js_file = $theme_dir . '/assets/dist/app.js';
	if ( file_exists( $js_file ) ) {
		wp_enqueue_script(
			'tema-estudo-react-app',
			$theme_uri . '/assets/dist/app.js',
			array(),
			filemtime( $js_file ),
			true // Carrega no rodapé
		);

		// Injeta configurações e credenciais dinâmicas para a aplicação React
		wp_localize_script(
			'tema-estudo-react-app',
			'EstudoApiConfig',
			array(
				'apiUrl'      => esc_url_raw( rest_url( 'api/v1/' ) ),
				'wpRestUrl'   => esc_url_raw( rest_url() ),
				'nonce'       => wp_create_nonce( 'wp_rest' ),
				'siteName'    => get_bloginfo( 'name' ),
				'description' => get_bloginfo( 'description' ),
				'homeUrl'     => esc_url( home_url( '/' ) ),
				'navbar'      => array(
					'style'      => get_theme_mod( 'tema_estudo_navbar_style', 'pill' ),
					'align'      => get_theme_mod( 'tema_estudo_navbar_align', 'left' ),
					'sticky'     => (bool) get_theme_mod( 'tema_estudo_navbar_sticky', true ),
					'showCounts' => (bool) get_theme_mod( 'tema_estudo_navbar_show_counts', true ),
					'accent'     => get_theme_mod( 'tema_estudo_navbar_accent', '#6366f1' ),
				),
			)
		);
	}
}
add_action( 'wp_enqueue_scripts', 'tema_estudo_enqueue_scripts' );

/**
 * Registrar opções de personalização da Navbar no WordPress Customizer
 */
function tema_estudo_customize_register( $wp_customize ) {
	$wp_customize->add_section( 'tema_estudo_navbar_section', array(
		'title'       => __( 'Personalização da Navbar', 'tema_estudo' ),
		'priority'    => 30,
		'description' => __( 'Configure o estilo visual, alinhamento e opções da barra de categorias do tema React.', 'tema_estudo' ),
	) );

	// 1. Estilo da Navbar
	$wp_customize->add_setting( 'tema_estudo_navbar_style', array(
		'default'           => 'pill',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'tema_estudo_navbar_style', array(
		'label'    => __( 'Estilo dos Botões / Links', 'tema_estudo' ),
		'section'  => 'tema_estudo_navbar_section',
		'type'     => 'select',
		'choices'  => array(
			'pill'      => __( 'Pill (Padrão Arredondado)', 'tema_estudo' ),
			'underline' => __( 'Underline (Linha Inferior)', 'tema_estudo' ),
			'glass'     => __( 'Glassmorphism (Translúcido)', 'tema_estudo' ),
			'minimal'   => __( 'Minimalista (Clean)', 'tema_estudo' ),
		),
	) );

	// 2. Alinhamento da Navbar
	$wp_customize->add_setting( 'tema_estudo_navbar_align', array(
		'default'           => 'left',
		'sanitize_callback' => 'sanitize_text_field',
	) );
	$wp_customize->add_control( 'tema_estudo_navbar_align', array(
		'label'    => __( 'Alinhamento dos Itens', 'tema_estudo' ),
		'section'  => 'tema_estudo_navbar_section',
		'type'     => 'select',
		'choices'  => array(
			'left'   => __( 'Esquerda', 'tema_estudo' ),
			'center' => __( 'Centro', 'tema_estudo' ),
			'right'  => __( 'Direita', 'tema_estudo' ),
		),
	) );

	// 3. Navbar Fixa (Sticky)
	$wp_customize->add_setting( 'tema_estudo_navbar_sticky', array(
		'default'           => true,
		'sanitize_callback' => 'wp_validate_boolean',
	) );
	$wp_customize->add_control( 'tema_estudo_navbar_sticky', array(
		'label'    => __( 'Fixar Navbar no Topo (Sticky)', 'tema_estudo' ),
		'section'  => 'tema_estudo_navbar_section',
		'type'     => 'checkbox',
	) );

	// 4. Exibir Contador de Posts
	$wp_customize->add_setting( 'tema_estudo_navbar_show_counts', array(
		'default'           => true,
		'sanitize_callback' => 'wp_validate_boolean',
	) );
	$wp_customize->add_control( 'tema_estudo_navbar_show_counts', array(
		'label'    => __( 'Exibir Contador de Posts nas Categorias', 'tema_estudo' ),
		'section'  => 'tema_estudo_navbar_section',
		'type'     => 'checkbox',
	) );

	// 5. Cor de Destaque (Accent)
	$wp_customize->add_setting( 'tema_estudo_navbar_accent', array(
		'default'           => '#6366f1',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tema_estudo_navbar_accent', array(
		'label'    => __( 'Cor de Destaque da Navbar', 'tema_estudo' ),
		'section'  => 'tema_estudo_navbar_section',
	) ) );
}
add_action( 'customize_register', 'tema_estudo_customize_register' );


/**
 * Adiciona o atributo type="module" na tag de script do bundle React (Vite)
 */
function tema_estudo_script_loader_tag( $tag, $handle, $src ) {
	if ( 'tema-estudo-react-app' === $handle ) {
		return '<script type="module" src="' . esc_url( $src ) . '"></script>' . "\n";
	}
	return $tag;
}
add_filter( 'script_loader_tag', 'tema_estudo_script_loader_tag', 10, 3 );

/**
 * Suporte a regras de reescrita para categorias e posts amigáveis (ex: /home/nome-slug-post-ou-produto)
 */
function tema_estudo_category_rewrite_rules() {
	add_rewrite_rule( '^category/([^/]+)/?$', 'index.php?category_name=$matches[1]', 'top' );
	add_rewrite_rule( '^([^/]+)/([^/]+)/?$', 'index.php?category_name=$matches[1]&name=$matches[2]', 'top' );

	if ( ! get_option( 'tema_estudo_rules_flushed_v4' ) ) {
		flush_rewrite_rules( false );
		update_option( 'tema_estudo_rules_flushed_v4', true );
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

	$uncategorized = get_term_by( 'name', 'Sem categoria', 'category' );
	if ( ! $uncategorized ) {
		$uncategorized = get_term_by( 'slug', 'uncategorized', 'category' );
	}

	if ( $uncategorized && ! is_wp_error( $uncategorized ) ) {
		$args['exclude'] = array( $uncategorized->term_id );
	}

	$categories = get_terms( $args );

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




