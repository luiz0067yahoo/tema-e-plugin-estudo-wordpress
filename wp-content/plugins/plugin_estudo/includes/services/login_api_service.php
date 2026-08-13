<?php 
require_once(plugin_dir_path(PLUGIN_FILE_URL) . 'includes/services/_service_api.php');
class LoginApiService extends ServiceApi {
    public function __construct($model) {
        parent::__construct($model);
    }
    public function before_login($params_data){
    }
    public function after_login($response,$request){
    }
    public function before_logout($params_data){
    }
    public function after_logout($response,$request){
    }
    public function before_newToken($params_data){
    }
    public function after_newToken($response,$request){
    }
    public function before_forgot($params_data){
    }
    public function after_forgot($response,$request){
    }
}
?>