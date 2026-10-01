<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
require_once(plugin_dir_path(PLUGIN_FILE_URL) . 'includes/models/_model_db.php');

class MarcaModel extends ModelDB {
    private $wpdb;

    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        parent::__construct(
            $table = "marca",
            $fields_names = [
                "id",
                "nome",
            ]
        );
    }
}
?>
