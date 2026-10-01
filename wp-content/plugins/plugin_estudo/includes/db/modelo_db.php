<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");

/**
 * Criação, migração e relacionamento da tabela 'modelo'
 */
function create_table_modelo() {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

    $table_marca  = $wpdb->prefix . 'marca';
    $table_modelo = $wpdb->prefix . 'modelo';

    // 1. Criar tabela 'modelo' se não existir
    $sql_modelo = "CREATE TABLE IF NOT EXISTS $table_modelo (
        id INT(11) NOT NULL AUTO_INCREMENT,
        id_marca INT(11) NOT NULL,
        nome VARCHAR(100) NOT NULL,
        PRIMARY KEY (id),
        KEY fk_produto_marca (id_marca)
    ) $charset_collate;";

    dbDelta($sql_modelo);

    // 2. Verificar se a tabela de marcas e de modelos existem antes de criar a Foreign Key
    $marca_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_marca));
    $modelo_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_modelo));

    if ($marca_exists === $table_marca && $modelo_exists === $table_modelo) {
        // Detecta o nome da chave primária na tabela marca ('id' ou 'id_marca')
        $marca_columns = $wpdb->get_col("DESCRIBE $table_marca", 0);
        $coluna_ref_marca = in_array('id', $marca_columns) ? 'id' : (in_array('id_marca', $marca_columns) ? 'id_marca' : 'id');

        // Nome da Constraint indicada na estrutura do phpMyAdmin
        $constraint_name = 'fk_produto_marca';

        // 3. Verificar no information_schema se a Foreign Key já existe
        $fk_exists = $wpdb->get_var($wpdb->prepare(
            "SELECT CONSTRAINT_NAME 
             FROM information_schema.TABLE_CONSTRAINTS 
             WHERE CONSTRAINT_SCHEMA = DATABASE() 
               AND TABLE_NAME = %s 
               AND CONSTRAINT_NAME = %s 
               AND CONSTRAINT_TYPE = 'FOREIGN KEY'",
            $table_modelo,
            $constraint_name
        ));

        // 4. Se a Foreign Key não existir, adiciona o relacionamento
        if (empty($fk_exists)) {
            try {
                // Garante que o índice existe
                $wpdb->query("ALTER TABLE $table_modelo ADD INDEX IF NOT EXISTS fk_produto_marca (id_marca)");

                // Cria a chave estrangeira (FOREIGN KEY)
                $wpdb->query(
                    "ALTER TABLE $table_modelo 
                     ADD CONSTRAINT $constraint_name 
                     FOREIGN KEY (id_marca) 
                     REFERENCES $table_marca($coluna_ref_marca) 
                     ON DELETE RESTRICT 
                     ON UPDATE CASCADE"
                );
            } catch (\Throwable $th) {
                // Silencia caso o banco já tenha a restrição ou registros órfãos pré-existentes
            }
        }
    }
}

// 1. Executa no ato de instalação / ativação do plugin
register_activation_hook(PLUGIN_FILE_URL, 'create_table_modelo');

// 2. Executa no ato de atualização do plugin
function check_update_modelo_db() {
    $db_version = '1.1';
    $installed_ver = get_option('plugin_estudo_modelo_db_version');

    if ($installed_ver !== $db_version) {
        create_table_modelo();
        update_option('plugin_estudo_modelo_db_version', $db_version);
    }
}
add_action('plugins_loaded', 'check_update_modelo_db');
?>
