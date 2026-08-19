<?php
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "includes/services/pages_service.php");
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . 'includes/models/wp_pages_model.php');
    use Firebase\JWT\JWT;

    class PagesController extends WP_REST_Controller {
        protected $service;
        protected $model;

        public function __construct() {
            $this->model = new WPPagesModel();
            $this->service = new PagesService($this->model);
        }

        public function record_routes() {
            $namespace = 'api/v1';
            $base = 'pages';
            
            register_rest_route($namespace, '/' . $base, array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array($this, 'read'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));
            
            register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array($this, 'read_by_id'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));
        }
        
        public function read($request) {
            $response = null;
            try {
                $params_data = $request->get_params();
                $per_page = isset($params_data['per_page']) ? intval($params_data['per_page']) : 12;
                $page = isset($params_data['page']) ? intval($params_data['page']) : 1;
                
                $pages = (object)$this->model->read($params_data, $page, $per_page, $orders = array());
                
                $response = new WP_REST_Response($pages->data, 200);
                $response->header('x-wp-total', $pages->total);
                $response->header('x-wp-totalpages', ceil($pages->total / $per_page));
                
                if (method_exists($this->service, 'after_create')) {
                    $this->service->after_create($response, $request);
                }
            } catch (Exception $erro) {
                $response = new WP_REST_Response(['message' => "error"], 400);
            }
            return $response;
        }

        public function read_by_id($request) {
            $response = null;
            try {
                $params_data = $request->get_params();
                
                if (method_exists($this->service, 'before_create')) {
                    $this->service->before_create($request);
                }
                
                $id = isset($params_data['id']) ? intval($params_data['id']) : "";
                $page_data = (object)$this->model->read_by_id($id);
                
                $response = new WP_REST_Response($page_data, 200);
                
                if (method_exists($this->service, 'after_create')) {
                    $this->service->after_create($response, $request);
                }
            } catch (Exception $erro) {
                $response = new WP_REST_Response(['message' => "not found"], 404);
            }
            return $response;
        }

        public function verifyopen($request) { 
            return true; 
        }
    }

    $results_pages_controller = new PagesController();
    add_action('rest_api_init', array($results_pages_controller, 'record_routes'));
?>