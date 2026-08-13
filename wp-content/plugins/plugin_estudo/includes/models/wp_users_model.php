<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
require_once(plugin_dir_path(PLUGIN_FILE_URL) . 'includes/models/_model_db.php');
class WPUsersModel extends ModelDB{
    private $wpdb;
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        parent::__construct(
            $table="users",
            $fields_names=[
                "ID",
                "user_login",
                "user_pass",
                "user_nicename",
                "user_email",
                "user_url",
                "user_registered",
                "user_status",
                "display_name",
            ],
        );
    }
    
}
?>