<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "includes/services/modelo_service.php");
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "includes/models/modelo_model.php");
use Firebase\JWT\JWT;

class ModeloController extends WP_REST_Controller {
    protected $service;
    protected $model;

    public function __construct() {
        $this->model = new ModeloModel();
        $this->service = new ModeloService($this->model);
    }

    public function record_routes() {
        $namespace = 'api/v1';
        $base = 'modelo';

        // 1. Listar e Criar: /api/v1/modelo
        register_rest_route($namespace, '/' . $base, array(
            // Listar modelos (GET)
            array(
                'methods'             => WP_REST_Server::READABLE, // GET
                'callback'            => array($this, 'read'),
                'permission_callback' => array($this, 'verifyopen'),
            ),
            // Criar modelo (POST)
            array(
                'methods'             => WP_REST_Server::CREATABLE, // POST
                'callback'            => array($this, 'create'),
                'permission_callback' => array($this, 'verifyopen'),
            ),
        ));

        // 2. Operações com ID: /api/v1/modelo/{id}
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', array(
            // Obter modelo por ID (GET)
            array(
                'methods'             => WP_REST_Server::READABLE, // GET
                'callback'            => array($this, 'read_by_id'),
                'permission_callback' => array($this, 'verifyopen'),
            ),
            // Atualizar modelo (PUT / PATCH / POST)
            array(
                'methods'             => WP_REST_Server::EDITABLE, // PUT / PATCH
                'callback'            => array($this, 'update'),
                'permission_callback' => array($this, 'verifyopen'),
            ),
            // Excluir modelo (DELETE)
            array(
                'methods'             => WP_REST_Server::DELETABLE, // DELETE
                'callback'            => array($this, 'delete'),
                'permission_callback' => array($this, 'verifyopen'),
            ),
        ));
    }

    /**
     * READ - Listar modelos com suporte a paginação e filtro por id_marca
     */
    public function read($request) {
        $response = null;
        try {
            $params_data = $request->get_params();
            $per_page = isset($params_data['per_page']) ? intval($params_data['per_page']) : (isset($params_data['all']) ? -1 : 10);
            $page = isset($params_data['page']) ? intval($params_data['page']) : 1;

            if (method_exists($this->service, 'before_read')) {
                $this->service->before_read($params_data, $page, $per_page);
            }

            $modelos = (object)$this->model->read($params_data, $page, $per_page, $orders = array('id' => 'desc'));

            $response = new WP_REST_Response($modelos->data, 200);
            $response->header('x-wp-total', $modelos->total);
            $totalPages = ($per_page > 0) ? ceil($modelos->total / $per_page) : 1;
            $response->header('x-wp-totalpages', $totalPages);

            if (method_exists($this->service, 'after_read')) {
                $this->service->after_read($response, $params_data, $page, $per_page);
            }
        } catch (Exception $erro) {
            $response = new WP_REST_Response(['message' => 'Erro ao listar modelos'], 400);
        }
        return $response;
    }

    /**
     * READ BY ID - Buscar modelo por ID
     */
    public function read_by_id($request) {
        $response = null;
        try {
            $id = intval($request['id']);

            if (method_exists($this->service, 'before_read_by_id')) {
                $this->service->before_read_by_id($id);
            }

            $modelo = $this->model->read_by_id($id);

            if ($modelo) {
                $response = new WP_REST_Response($modelo, 200);
                if (method_exists($this->service, 'after_read_by_id')) {
                    $this->service->after_read_by_id($response, $id);
                }
            } else {
                $response = new WP_REST_Response(['message' => 'Modelo não encontrado'], 404);
            }
        } catch (Exception $erro) {
            $response = new WP_REST_Response(['message' => 'Erro ao buscar modelo'], 400);
        }
        return $response;
    }

    /**
     * CREATE - Cadastrar novo modelo
     */
    public function create($request) {
        $response = null;
        try {
            $params = $request->get_json_params();
            if (empty($params)) {
                $params = $request->get_params();
            }

            $nome     = isset($params['nome']) ? sanitize_text_field($params['nome']) : '';
            $id_marca = isset($params['id_marca']) ? intval($params['id_marca']) : 0;

            if (empty($nome)) {
                return new WP_REST_Response(['message' => 'O campo "nome" é obrigatório.'], 400);
            }

            if ($id_marca <= 0) {
                return new WP_REST_Response(['message' => 'O campo "id_marca" é obrigatório e deve ser válido.'], 400);
            }

            if (method_exists($this->service, 'before_create')) {
                $this->service->before_create($params);
            }

            $dados = [
                'id_marca' => $id_marca,
                'nome'     => $nome,
            ];

            $novo_modelo = $this->model->create($dados);

            if ($novo_modelo) {
                $response = new WP_REST_Response($novo_modelo, 201);
                if (method_exists($this->service, 'after_create')) {
                    $this->service->after_create($response, $params);
                }
            } else {
                $response = new WP_REST_Response(['message' => 'Erro ao inserir modelo no banco de dados'], 500);
            }
        } catch (Exception $erro) {
            $response = new WP_REST_Response(['message' => $erro->getMessage()], 400);
        }
        return $response;
    }

    /**
     * UPDATE - Atualizar dados do modelo por ID
     */
    public function update($request) {
        $response = null;
        try {
            $id = intval($request['id']);
            $params = $request->get_json_params();
            if (empty($params)) {
                $params = $request->get_params();
            }

            $modelo_existente = $this->model->read_by_id($id);
            if (!$modelo_existente) {
                return new WP_REST_Response(['message' => 'Modelo não encontrado para atualização'], 404);
            }

            $nome     = isset($params['nome']) ? sanitize_text_field($params['nome']) : $modelo_existente['nome'];
            $id_marca = isset($params['id_marca']) ? intval($params['id_marca']) : intval($modelo_existente['id_marca']);

            if (method_exists($this->service, 'before_update')) {
                $this->service->before_update($id, $params);
            }

            $dados = [
                'id_marca' => $id_marca,
                'nome'     => $nome,
            ];

            $modelo_atualizado = $this->model->update($id, $dados);

            if ($modelo_atualizado) {
                $response = new WP_REST_Response($modelo_atualizado, 200);
                if (method_exists($this->service, 'after_update')) {
                    $this->service->after_update($response, $id, $params);
                }
            } else {
                $response = new WP_REST_Response(['message' => 'Nenhuma alteração realizada ou erro ao atualizar'], 400);
            }
        } catch (Exception $erro) {
            $response = new WP_REST_Response(['message' => $erro->getMessage()], 400);
        }
        return $response;
    }

    /**
     * DELETE - Excluir modelo por ID
     */
    public function delete($request) {
        $response = null;
        try {
            $id = intval($request['id']);

            $modelo_existente = $this->model->read_by_id($id);
            if (!$modelo_existente) {
                return new WP_REST_Response(['message' => 'Modelo não encontrado para exclusão'], 404);
            }

            if (method_exists($this->service, 'before_delete')) {
                $this->service->before_delete($id);
            }

            $excluido = $this->model->delete($id);

            if ($excluido) {
                $response = new WP_REST_Response([
                    'message' => 'Modelo excluído com sucesso',
                    'id'      => $id
                ], 200);
                if (method_exists($this->service, 'after_delete')) {
                    $this->service->after_delete($response, $id);
                }
            } else {
                $response = new WP_REST_Response(['message' => 'Falha ao excluir modelo'], 400);
            }
        } catch (Exception $erro) {
            $response = new WP_REST_Response(['message' => $erro->getMessage()], 400);
        }
        return $response;
    }

    public function verifyopen($request) {
        return true;
    }
}

$results_modelo_controller = new ModeloController();
add_action('rest_api_init', array($results_modelo_controller, 'record_routes'));
?>
