<?php
	require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    function remover_logo_wordpress() {
        global $wp_admin_bar;

        // Remove o nó "wp-logo"
        $user = wp_get_current_user();
        $user_roles = (array) $user->roles;
        if (in_array('atendimento', $user_roles)) {
            $wp_admin_bar->remove_node('wp-logo');
        }
    }

    // Gancho para chamar a função
    add_action('wp_before_admin_bar_render', 'remover_logo_wordpress');
				
?>