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
                <a href="<?php echo esc_url(home_url('/')); ?>" class="site-logo-link">
                    <img id="api-site-logo" src="" alt="" style="display: none;" class="site-logo" />
                </a>
                <div class="site-title-group">
                    <h1 class="site-title" id="api-site-title">
                        <a href="<?php echo esc_url(home_url('/')); ?>"></a>
                    </h1>
                    <p class="site-description" id="api-site-description"></p>
                </div>
            </div>
            <nav class="site-navigation" id="api-header-nav">
                <ul class="nav-menu">
                    <li class="nav-item-wrap"><a href="" class="nav-item"></a></li>
                </ul>
            </nav>
        </div>
    </header>
