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
	// Main Theme Stylesheet
	wp_enqueue_style(
		'tema-estudo-style',
		get_stylesheet_uri(),
		array(),
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
		)
	);
}
add_action( 'wp_enqueue_scripts', 'tema_estudo_enqueue_scripts' );
