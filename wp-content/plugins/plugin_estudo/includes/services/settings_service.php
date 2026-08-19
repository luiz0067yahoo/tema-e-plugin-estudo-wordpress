<?php 
require_once(plugin_dir_path(PLUGIN_FILE_URL) . 'includes/services/_service_api.php');
class SettingsService extends ServiceApi {
    public function __construct() {
        parent::__construct(null);
    }
    public function before_create($params_data){
    }
}
?>