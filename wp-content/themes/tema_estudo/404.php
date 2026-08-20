<?php
/**
 * 404 Not Found Template for Tema Estudo.
 *
 * @package TemaEstudo
 */

get_header();
?>

<main class="main-container">
    <section class="content-area">
        <div class="api-404-container">
            <div class="api-404-card">
                <h1 class="api-404-code">404</h1>
                <h2 class="api-404-title">Página ou Conteúdo Não Encontrado</h2>
                <p class="api-404-message">Desculpe, o conteúdo que você está procurando não foi encontrado ou não existe mais.</p>
                <div class="api-404-actions">
                    <a href="<?php echo esc_url(home_url('/')); ?>" class="api-button-404">&larr; Voltar para a Página Inicial</a>
                </div>
            </div>
        </div>
    </section>
</main>

<?php
get_footer();
