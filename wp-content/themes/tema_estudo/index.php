<?php
/**
 * Main index template for Tema Estudo (React SPA Shell).
 *
 * @package TemaEstudo
 */

get_header();
?>

<div id="root">
    <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center; background: #0b0f19; color: #94a3b8; font-family: sans-serif;">
        <noscript>
            <p><?php esc_html_e( 'Este tema requer JavaScript habilitado para executar a aplicação em React.', 'tema_estudo' ); ?></p>
        </noscript>
    </div>
</div>

<?php
get_footer();
