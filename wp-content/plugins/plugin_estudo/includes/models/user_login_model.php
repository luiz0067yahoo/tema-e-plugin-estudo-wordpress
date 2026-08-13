<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    
require_once(plugin_dir_path(PLUGIN_FILE_URL) . 'includes/models/_model_db.php');
class UserLoginModel extends ModelDB{
    private $wpdb;
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        parent::__construct(
            $table="_os_users_logins",
            $fields_names=[
                "id",
                "id_user",
                "jwt",
                "start_login",
                "end_login",
            ],
        );
    }
    
}
?>