<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
require_once(plugin_dir_path(PLUGIN_FILE_URL) . 'includes/models/_model_db.php');

class ModeloModel extends ModelDB {
    private $wpdb;

    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        parent::__construct(
            $table = "modelo",
            $fields_names = [
                "id",
                "id_marca",
                "nome",
            ]
        );
    }
}
?>
