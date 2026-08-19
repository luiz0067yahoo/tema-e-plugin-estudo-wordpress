<?php
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "includes/services/products_service.php");
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . 'includes/models/wp_products_model.php');
    use Firebase\JWT\JWT;
    class ProductsController extends WP_REST_Controller {
        protected $service;
        protected $model;

        public function __construct() {
            $this->model=new WPProductsModel();
            $this->service=new ProductsService($this->model);
        }

        public function record_routes() {
            $namespace='api/v1';
            $base='products';
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
            $response=null;
            try {
                $params_data = $request->get_params();
                $per_page = isset($params_data['per_page']) ? intval($params_data['per_page']) : 12;
                $page = isset($params_data['page']) ? intval($params_data['page']) : 1;
                $products=(object)$this->model->read($params_data,$page,$per_page,$orders= array());
                $response = new WP_REST_Response($products->data, 200);
                $response->header('x-wp-total', $products->total);
                $response->header('x-wp-totalpages',ceil( $products->total/$per_page));
                $this->service->after_create($response,$request);
            } catch (Exception $erro) {
                $response = new WP_REST_Response(['message' => "error"], 400);
            }
            return $response;
        }

        public function read_by_id($request) {
            $response=null;
            try {
                $params_data = $request->get_params();
                $this->service->before_create($request);
                $id = isset($params_data['id']) ? intval($params_data['id']) : "";
                $product_data=(object)$this->model->read_by_id($id);
                $response = new WP_REST_Response($product_data, 200);
                $this->service->after_create($response,$request);
            } catch (Exception $erro) {
                $response = new WP_REST_Response(['message' => "not found"], 404);
            }
            return $response;
        }

        public function verifyopen($request) {return true;}
    }
    $results_controller = new ProductsController();
    add_action('rest_api_init', array($results_controller, 'record_routes'));
?>