<?php
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "includes/services/settings_service.php");
    use Firebase\JWT\JWT;
    class SettingsController extends WP_REST_Controller {
        protected $service;

        public function __construct() {
            $this->service=new SettingsService();
        }

        public function record_routes() {
            $namespace='api/v1';
            $base='settings';
            register_rest_route($namespace, '/' . $base, array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array($this, 'read'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));
        }
        
        public function read($request) {
            $response=null;
            try {
                $params_data = $request->get_params();
                $this->service->before_create($params_data); 
                $site_settings = array(
                    'title' => get_bloginfo('name'),
                    'description' => get_bloginfo('description'),
                    // Adicione mais configurações conforme necessário
                );
                $response = new WP_REST_Response($site_settings, 200);
                $this->service->after_create($response,$request);
            } catch (Exception $erro) {
                $response = new WP_REST_Response(['message' => "username or password inválid"], 400);
            }
            return $response;
        }
        public function verifyopen($request) {return true;}
       
    }
    $results_controller = new SettingsController();
    add_action('rest_api_init', array($results_controller, 'record_routes'));
?>