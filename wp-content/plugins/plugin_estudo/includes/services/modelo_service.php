<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . 'includes/services/_service_api.php');

class ModeloService extends ServiceApi {
    public function __construct($model) {
        parent::__construct($model);
    }

    public function before_create($params_data) {
        // Validações antes da criação do modelo
    }

    public function before_update($id, $params_data) {
        // Validações antes da atualização do modelo
    }
}
?>
