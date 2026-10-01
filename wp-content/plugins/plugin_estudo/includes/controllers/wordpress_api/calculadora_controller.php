<?php
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    use Firebase\JWT\JWT;
    class Calculadora_Controller extends WP_REST_Controller {   
        public function __construct() { }
        public function record_routes() {
            $namespace='api/v1';
            $base='calculadora';
            register_rest_route($namespace,$base . '/soma/(?P<v1>\d+)/(?P<v2>\d+)' , array(
                array(
                    'methods'             => WP_REST_Server::READABLE,//GET
                    'callback'            => array($this, 'soma'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));            
            register_rest_route($namespace,$base . '/subtracao/(?P<v1>\d+)/(?P<v2>\d+)' , array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,//POST
                    'callback'            => array($this, 'subtracao'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));    
            register_rest_route($namespace,$base . '/multiplicacao/(?P<v1>\d+)/(?P<v2>\d+)' , array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE, // Aceita POST, *PUT*, PATCH
                    'callback'            => array($this, 'multiplicacao'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));    
            register_rest_route($namespace,$base . '/divisao/(?P<v1>\d+)/(?P<v2>\d+)' , array(
                array(
                    'methods'             =>  WP_REST_Server::DELETABLE,//DELETE
                    'callback'            => array($this, 'divisao'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));    
        }        
        public function soma($request) {
            $v1 = isset($request['v1']) ? intval($request['v1']) : 0;
            $v2 = isset($request['v2']) ? intval($request['v2']) : 0;
            return json_encode(["resultado"=>$v1 + $v2]);
        }
        public function subtracao($request) {
            $v1 = isset($request['v1']) ? intval($request['v1']) : 0;
            $v2 = isset($request['v2']) ? intval($request['v2']) : 0;
            return json_encode(["resultado"=>$v1 - $v2]);
        }
		public function divisao($request) {
            $v1 = isset($request['v1']) ? intval($request['v1']) : 0;
            $v2 = isset($request['v2']) ? intval($request['v2']) : 0;
            return json_encode(["resultado"=>$v1 / $v2]);
        }
        public function multiplicacao($request) {
            $v1 = isset($request['v1']) ? intval($request['v1']) : 0;
            $v2 = isset($request['v2']) ? intval($request['v2']) : 0;
            return json_encode(["resultado"=>$v1 * $v2]);
        }
        
        public function verifyopen($request) {return true;}
    }
    $results_controller = new Calculadora_Controller();
    add_action('rest_api_init', array($results_controller, 'record_routes'));
?>