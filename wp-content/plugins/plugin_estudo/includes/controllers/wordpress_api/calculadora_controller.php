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
            // 5. Fibonacci via PATH: GET /api/v1/calculadora/fibonacci/{n}
            register_rest_route($namespace, $base . '/fibonacci/(?P<n>\d+)', array(
                array(
                    'methods'             => WP_REST_Server::READABLE, // GET
                    'callback'            => array($this, 'fibonacci'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));
            // 6. Potência via BODY RAW POST: POST /api/v1/calculadora/potencia (body: {"v1": 2, "v2": 3})
            register_rest_route($namespace, $base . '/potencia', array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE, // POST
                    'callback'            => array($this, 'potencia'),
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
        
        /**
         * Fibonacci via PATH: Retorna o n-ésimo número e a sequência até a posição informada
         * Exemplo de chamada: GET /api/v1/calculadora/fibonacci/7
         */
        public function fibonacci($request) {
            $n = isset($request['n']) ? intval($request['n']) : 0;

            if ($n <= 0) {
                return json_encode([
                    "posicao"   => 0,
                    "resultado" => 0,
                    "sequencia" => [0]
                ]);
            }

            $seq = [0, 1];
            for ($i = 2; $i <= $n; $i++) {
                $seq[$i] = $seq[$i - 1] + $seq[$i - 2];
            }

            return json_encode([
                "posicao"   => $n,
                "resultado" => $seq[$n],
                "sequencia" => $seq
            ]);
        }

        /**
         * Potência via BODY RAW POST: Calcula v1 elevado a v2
         * Exemplo de body JSON: { "v1": 2, "v2": 8 }
         */
        public function potencia($request) {
            // Obtém os parâmetros enviados no corpo raw JSON da requisição
            $body = $request->get_json_params();
            if (empty($body)) {
                $raw = $request->get_body();
                $body = json_decode($raw, true);
            }
            if (empty($body)) {
                $body = $request->get_params();
            }

            $v1 = isset($body['v1']) ? floatval($body['v1']) : 0;
            $v2 = isset($body['v2']) ? floatval($body['v2']) : 0;
            $resultado = pow($v1, $v2);

            return json_encode([
                "base"      => $v1,
                "expoente"  => $v2,
                "resultado" => $resultado
            ]);
        }
        
        public function verifyopen($request) {return true;}
    }
    $results_controller = new Calculadora_Controller();
    add_action('rest_api_init', array($results_controller, 'record_routes'));
?>