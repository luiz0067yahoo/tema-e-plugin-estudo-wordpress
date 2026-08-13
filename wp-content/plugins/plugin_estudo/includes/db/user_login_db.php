<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    
function create_table_users_logins() {
    global $wpdb;
    $table_name = $wpdb->prefix . '_os_users_logins';
    $table_wp_user=$wpdb->prefix . 'users';
    $charset_collate = $wpdb->get_charset_collate();
    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id INT NOT NULL AUTO_INCREMENT,
        id_user bigint(20) UNSIGNED  not null,
        jwt text,
        start_login datetime,
        end_login datetime,
        PRIMARY KEY (id),
        FOREIGN KEY (id_user) REFERENCES $table_wp_user(id)
    ) $charset_collate;";
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);

    $table_structure = $wpdb->get_results("DESCRIBE $table_name");
    $field_exists = false;
    foreach ($table_structure as $column) {
        if ($column->Field === 'jwt') {
            $field_exists = true;
            break;
        }
    }

    if (!$field_exists) {
        $wpdb->query("ALTER TABLE $table_name ADD COLUMN jwt TEXT");
    }
}
register_activation_hook(PLUGIN_FILE_URL, 'create_table_users_logins');
?>