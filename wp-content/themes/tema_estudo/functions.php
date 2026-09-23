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
	register_nav_menus( array(
		'primary' => __( 'Menu Superior / Navbar Categorias', 'tema_estudo' ),
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
				'siteName'     => get_bloginfo( 'name' ),
				'description'  => get_bloginfo( 'description' ),
				'homeUrl'      => esc_url( home_url( '/' ) ),
				'adminUrl'     => esc_url( admin_url() ),
				'isLoggedIn'   => is_user_logged_in(),
				'canEditPosts' => current_user_can( 'edit_posts' ),
				'isEditMode'   => is_customize_preview() || is_user_logged_in() || current_user_can( 'edit_theme_options' ),
				'categories'        => tema_estudo_get_all_categories(),
				'topMenuCategories' => tema_estudo_get_top_menu_categories(),
				'themeColors'       => array(
					'bgMain'        => get_theme_mod( 'tema_estudo_bg_main', '#0b0f19' ),
					'bgSurface'     => get_theme_mod( 'tema_estudo_bg_surface', '#111827' ),
					'bgCard'        => get_theme_mod( 'tema_estudo_bg_card', '#111827' ),
					'textPrimary'   => get_theme_mod( 'tema_estudo_text_primary', '#f8fafc' ),
					'textSecondary' => get_theme_mod( 'tema_estudo_text_secondary', '#94a3b8' ),
					'primary'       => get_theme_mod( 'tema_estudo_primary_color', '#6366f1' ),
					'accent'        => get_theme_mod( 'tema_estudo_accent_color', '#06b6d4' ),
				),
				'navbar'      => array(
					'style'     => get_theme_mod( 'tema_estudo_navbar_style', 'pill' ),
					'align'     => get_theme_mod( 'tema_estudo_navbar_align', 'left' ),
					'sticky'    => (bool) get_theme_mod( 'tema_estudo_navbar_sticky', true ),
					'accent'    => get_theme_mod( 'tema_estudo_navbar_accent', '#6366f1' ),
					'bgColor'   => get_theme_mod( 'tema_estudo_navbar_bg_color', '#111827' ),
					'textColor' => get_theme_mod( 'tema_estudo_navbar_text_color', '#94a3b8' ),
				),
			)
		);
	}
}
add_action( 'wp_enqueue_scripts', 'tema_estudo_enqueue_scripts' );

/**
 * Injeta variáveis CSS no <head> para as cores customizadas do tema
 */
function tema_estudo_output_theme_colors_css() {
	$bg_main        = get_theme_mod( 'tema_estudo_bg_main', '#0b0f19' );
	$bg_surface     = get_theme_mod( 'tema_estudo_bg_surface', '#111827' );
	$bg_card        = get_theme_mod( 'tema_estudo_bg_card', '#111827' );
	$text_primary   = get_theme_mod( 'tema_estudo_text_primary', '#f8fafc' );
	$text_secondary = get_theme_mod( 'tema_estudo_text_secondary', '#94a3b8' );
	$primary        = get_theme_mod( 'tema_estudo_primary_color', '#6366f1' );
	$accent         = get_theme_mod( 'tema_estudo_accent_color', '#06b6d4' );

	echo "<style id=\"tema-estudo-custom-theme-colors\">\n";
	echo ":root {\n";
	if ( $bg_main )        echo "  --bg-main: " . esc_attr( $bg_main ) . ";\n";
	if ( $bg_surface )     echo "  --bg-surface: " . esc_attr( $bg_surface ) . ";\n";
	if ( $bg_card )        echo "  --bg-card: " . esc_attr( $bg_card ) . ";\n";
	if ( $text_primary )   echo "  --text-primary: " . esc_attr( $text_primary ) . ";\n";
	if ( $text_secondary ) echo "  --text-secondary: " . esc_attr( $text_secondary ) . ";\n";
	if ( $primary ) {
		echo "  --primary: " . esc_attr( $primary ) . ";\n";
		echo "  --border-focus: " . esc_attr( $primary ) . "80;\n";
		echo "  --shadow-glow: 0 0 28px " . esc_attr( $primary ) . "40;\n";
	}
	if ( $accent )         echo "  --accent: " . esc_attr( $accent ) . ";\n";
	echo "}\n";
	echo "</style>\n";
}
add_action( 'wp_head', 'tema_estudo_output_theme_colors_css', 100 );

/**
 * Registrar opções de personalização da Navbar e Cores do Tema no WordPress Customizer
 */
function tema_estudo_customize_register( $wp_customize ) {
	// ==========================================
	// 1. SEÇÃO: Cores Gerais do Tema
	// ==========================================
	$wp_customize->add_section( 'tema_estudo_theme_colors_section', array(
		'title'       => __( 'Cores Gerais do Tema', 'tema_estudo' ),
		'priority'    => 25,
		'description' => __( 'Personalize o fundo principal, cabeçalho/superfície, cards de posts, textos e cores de destaque.', 'tema_estudo' ),
	) );

	// 1.1 Cor de Fundo Principal (Body)
	$wp_customize->add_setting( 'tema_estudo_bg_main', array(
		'default'           => '#0b0f19',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tema_estudo_bg_main', array(
		'label'    => __( 'Cor de Fundo Principal (Geral / Body)', 'tema_estudo' ),
		'section'  => 'tema_estudo_theme_colors_section',
	) ) );

	// 1.2 Cor de Superfície (Header / Rodapé)
	$wp_customize->add_setting( 'tema_estudo_bg_surface', array(
		'default'           => '#111827',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tema_estudo_bg_surface', array(
		'label'    => __( 'Cor de Superfície (Cabeçalho / Rodapé)', 'tema_estudo' ),
		'section'  => 'tema_estudo_theme_colors_section',
	) ) );

	// 1.3 Cor de Fundo dos Cards
	$wp_customize->add_setting( 'tema_estudo_bg_card', array(
		'default'           => '#111827',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tema_estudo_bg_card', array(
		'label'    => __( 'Cor de Fundo dos Cards de Posts e Produtos', 'tema_estudo' ),
		'section'  => 'tema_estudo_theme_colors_section',
	) ) );

	// 1.4 Cor do Texto Principal
	$wp_customize->add_setting( 'tema_estudo_text_primary', array(
		'default'           => '#f8fafc',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tema_estudo_text_primary', array(
		'label'    => __( 'Cor do Texto Principal (Títulos e Conteúdo)', 'tema_estudo' ),
		'section'  => 'tema_estudo_theme_colors_section',
	) ) );

	// 1.5 Cor do Texto Secundário
	$wp_customize->add_setting( 'tema_estudo_text_secondary', array(
		'default'           => '#94a3b8',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tema_estudo_text_secondary', array(
		'label'    => __( 'Cor do Texto Secundário (Descrições e Metas)', 'tema_estudo' ),
		'section'  => 'tema_estudo_theme_colors_section',
	) ) );

	// 1.6 Cor Primária / Destaques
	$wp_customize->add_setting( 'tema_estudo_primary_color', array(
		'default'           => '#6366f1',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tema_estudo_primary_color', array(
		'label'    => __( 'Cor Primária (Botões de Ação e Destaques)', 'tema_estudo' ),
		'section'  => 'tema_estudo_theme_colors_section',
	) ) );

	// 1.7 Cor de Acento Secundária
	$wp_customize->add_setting( 'tema_estudo_accent_color', array(
		'default'           => '#06b6d4',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tema_estudo_accent_color', array(
		'label'    => __( 'Cor de Acento Secundária (Gradientes e Detalhes)', 'tema_estudo' ),
		'section'  => 'tema_estudo_theme_colors_section',
	) ) );

	// ==========================================
	// 2. SEÇÃO: Personalização da Navbar
	// ==========================================
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

	// 4. Cor de Destaque (Accent)
	$wp_customize->add_setting( 'tema_estudo_navbar_accent', array(
		'default'           => '#6366f1',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tema_estudo_navbar_accent', array(
		'label'    => __( 'Cor de Destaque da Navbar', 'tema_estudo' ),
		'section'  => 'tema_estudo_navbar_section',
	) ) );

	// 5. Cor de Fundo da Navbar (Background)
	$wp_customize->add_setting( 'tema_estudo_navbar_bg_color', array(
		'default'           => '#111827',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tema_estudo_navbar_bg_color', array(
		'label'    => __( 'Cor de Fundo da Navbar', 'tema_estudo' ),
		'section'  => 'tema_estudo_navbar_section',
	) ) );

	// 6. Cor do Texto dos Links da Navbar (Text Color)
	$wp_customize->add_setting( 'tema_estudo_navbar_text_color', array(
		'default'           => '#94a3b8',
		'sanitize_callback' => 'sanitize_hex_color',
	) );
	$wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'tema_estudo_navbar_text_color', array(
		'label'    => __( 'Cor do Texto dos Links da Navbar', 'tema_estudo' ),
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

/**
 * Obtém todas as categorias cadastradas no WordPress para a Navbar do tema React.
 *
 * @return array Lista estruturada com todas as categorias ativas.
 */
function tema_estudo_get_all_categories() {
	$args = array(
		'taxonomy'   => 'category',
		'hide_empty' => false,
		'orderby'    => 'id', // Ordem de criação (ID / term_id ASC)
		'order'      => 'ASC',
		'number'     => 0, // 0 = retorna todas as categorias sem limite
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
		return array();
	}

	$list = array();
	foreach ( $categories as $cat ) {
		$list[] = array(
			'id'          => $cat->term_id,
			'name'        => $cat->name,
			'slug'        => $cat->slug,
			'count'       => (int) $cat->count,
			'parent'      => (int) $cat->parent,
			'description' => $cat->description,
			'edit_url'    => admin_url( 'term.php?taxonomy=category&tag_ID=' . $cat->term_id . '&post_type=post' ),
		);
	}

	return $list;
}

/**
 * Redireciona buscas nativas do WordPress (?s=termo) para a rota amigável /busca/{termo}
 */
function tema_estudo_redirect_search() {
	if ( ! is_admin() && isset( $_GET['s'] ) && '' !== trim( $_GET['s'] ) ) {
		$search_query = rawurlencode( trim( wp_unslash( $_GET['s'] ) ) );
		wp_safe_redirect( home_url( '/busca/' . $search_query ) );
		exit;
	}
}
add_action( 'template_redirect', 'tema_estudo_redirect_search' );

/**
 * Retorna exclusivamente as categorias presentes no Menu Superior (Menu Topo) do WordPress.
 * Respeita a ordem personalizada de arrastar e soltar e a hierarquia (subitens) configurada no WP Admin.
 *
 * @return array Lista estruturada com as categorias presentes no menu topo.
 */
function tema_estudo_get_top_menu_categories() {
	$locations = get_nav_menu_locations();
	$menu_id   = 0;

	// 1. Tenta obter o menu atribuído à localização 'primary' (Menu Superior / Navbar Categorias)
	if ( ! empty( $locations['primary'] ) ) {
		$menu_id = (int) $locations['primary'];
	} else {
		// 2. Se nenhuma localização foi associada, busca por menus com nomes sugestivos ou o primeiro menu existente
		$menus = wp_get_nav_menus();
		if ( ! empty( $menus ) ) {
			foreach ( $menus as $m ) {
				$name_slug = strtolower( $m->slug . ' ' . $m->name );
				if (
					strpos( $name_slug, 'topo' ) !== false ||
					strpos( $name_slug, 'superior' ) !== false ||
					strpos( $name_slug, 'header' ) !== false ||
					strpos( $name_slug, 'navbar' ) !== false ||
					strpos( $name_slug, 'principal' ) !== false ||
					strpos( $name_slug, 'primary' ) !== false
				) {
					$menu_id = (int) $m->term_id;
					break;
				}
			}
			if ( ! $menu_id && ! empty( $menus[0]->term_id ) ) {
				$menu_id = (int) $menus[0]->term_id;
			}
		}
	}

	if ( ! $menu_id ) {
		return array();
	}

	$items = wp_get_nav_menu_items( $menu_id );
	if ( empty( $items ) || is_wp_error( $items ) ) {
		return array();
	}

	$menu_items_map = array();

	foreach ( $items as $item ) {
		$cat  = null;
		$slug = '';

		// A. Item do tipo Categoria nativa do WordPress
		if ( 'category' === $item->object || ( 'taxonomy' === $item->type && 'category' === $item->object ) ) {
			$cat = get_term( (int) $item->object_id, 'category' );
			if ( $cat && ! is_wp_error( $cat ) ) {
				$slug = $cat->slug;
			}
		} elseif ( ! empty( $item->url ) ) {
			// B. Item como link customizado apontando para a URL de uma categoria ou página
			$path     = trim( (string) wp_parse_url( $item->url, PHP_URL_PATH ), '/' );
			$segments = explode( '/', $path );
			$last_seg = end( $segments );
			if ( $last_seg ) {
				$cat_by_slug = get_term_by( 'slug', $last_seg, 'category' );
				if ( $cat_by_slug && ! is_wp_error( $cat_by_slug ) ) {
					$cat  = $cat_by_slug;
					$slug = $cat_by_slug->slug;
				} else {
					$slug = sanitize_title( $last_seg );
				}
			}
		}

		if ( empty( $slug ) ) {
			$slug = sanitize_title( $item->title );
		}

		$cat_id = ( $cat && ! is_wp_error( $cat ) ) ? (int) $cat->term_id : (int) $item->ID;
		$name   = ! empty( $item->title ) ? $item->title : ( ( $cat && ! is_wp_error( $cat ) ) ? $cat->name : 'Item' );

		$menu_items_map[ (int) $item->ID ] = array(
			'id'           => $cat_id,
			'name'         => $name,
			'slug'         => $slug,
			'count'        => ( $cat && ! is_wp_error( $cat ) ) ? (int) $cat->count : 0,
			'parent'       => 0,
			'menu_item_id' => (int) $item->ID,
			'menu_parent'  => (int) $item->menu_item_parent,
			'menu_order'   => (int) $item->menu_order,
			'description'  => ( $cat && ! is_wp_error( $cat ) ) ? $cat->description : '',
			'edit_url'     => ( $cat && ! is_wp_error( $cat ) ) ? admin_url( 'term.php?taxonomy=category&tag_ID=' . $cat_id . '&post_type=post' ) : '',
			'children'     => array(),
		);
	}

	// Constrói a árvore com suporte a sub-níveis ilimitados
	$tree = array();
	foreach ( $menu_items_map as $item_id => &$node ) {
		$parent_id = $node['menu_parent'];
		if ( $parent_id > 0 && isset( $menu_items_map[ $parent_id ] ) ) {
			$node['parent'] = $menu_items_map[ $parent_id ]['id'];
			$menu_items_map[ $parent_id ]['children'][] = &$node;
		} else {
			$tree[] = &$node;
		}
	}
	unset( $node );

	return $tree;
}

/**
 * Registra rotas REST para consultar as categorias presentes no menu topo
 */
function tema_estudo_register_menu_categories_rest_routes() {
	register_rest_route( 'api/v1', '/menu-categories', array(
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => function () {
			return rest_ensure_response( tema_estudo_get_top_menu_categories() );
		},
		'permission_callback' => '__return_true',
	) );
	register_rest_route( 'tema-estudo/v1', '/menu-categories', array(
		'methods'             => WP_REST_Server::READABLE,
		'callback'            => function () {
			return rest_ensure_response( tema_estudo_get_top_menu_categories() );
		},
		'permission_callback' => '__return_true',
	) );
}
add_action( 'rest_api_init', 'tema_estudo_register_menu_categories_rest_routes' );


