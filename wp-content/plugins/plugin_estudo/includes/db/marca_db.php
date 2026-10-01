<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");

/**
 * Criação e migração da tabela 'marca'
 */
function create_table_marca() {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

    $table_marca = $wpdb->prefix . 'marca';

    // Criação da tabela marca (campos: id e nome)
    $sql_marca = "CREATE TABLE IF NOT EXISTS $table_marca (
        id INT(11) NOT NULL AUTO_INCREMENT,
        nome VARCHAR(100) NOT NULL,
        PRIMARY KEY (id)
    ) $charset_collate;";

    dbDelta($sql_marca);
}

// 1. Executa no ato de instalação / ativação do plugin
register_activation_hook(PLUGIN_FILE_URL, 'create_table_marca');

// 2. Executa no ato de atualização do plugin
function check_update_marca_db() {
    $db_version = '1.1';
    $installed_ver = get_option('plugin_estudo_marca_db_version');

    if ($installed_ver !== $db_version) {
        create_table_marca();
        update_option('plugin_estudo_marca_db_version', $db_version);
    }
}
add_action('plugins_loaded', 'check_update_marca_db');
?>
