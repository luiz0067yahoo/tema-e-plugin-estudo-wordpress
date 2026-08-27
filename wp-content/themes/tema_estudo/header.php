<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php wp_title('|', true, 'right'); ?></title>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
    <?php wp_body_open(); ?>
    
    <header class="site-header">
        <div class="site-header-container">
            <div class="site-brand" id="api-header-brand">
                <?php 
                $first_cat = function_exists('tema_estudo_get_first_category_slug') ? tema_estudo_get_first_category_slug() : null;
                $first_cat_url = $first_cat ? home_url('/' . $first_cat) : home_url('/');
                ?>
                <a href="<?php echo esc_url($first_cat_url); ?>" class="site-logo-link" id="api-site-logo-link">
                    <img id="api-site-logo" src="" alt="" class="site-logo" style="display: none;" />
                </a>
                <div class="site-title-group">
                    <h1 class="site-title" id="api-site-title">
                        <a href="<?php echo esc_url($first_cat_url); ?>"></a>
                    </h1>
                    <p class="site-description" id="api-site-description"></p>
                </div>
            </div>
            <button class="hamburger-btn" id="hamburger-btn" aria-label="Abrir menu" aria-expanded="false" aria-controls="api-header-nav">
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
            </button>
            <nav class="site-navigation" id="api-header-nav">
                <ul class="nav-menu">
                    <li class="nav-item-wrap"><a href="" class="nav-item"></a></li>
                </ul>
            </nav>
        </div>
    </header>
    <div class="nav-overlay" id="nav-overlay"></div>
