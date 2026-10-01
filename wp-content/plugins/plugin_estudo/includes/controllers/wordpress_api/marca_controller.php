<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "includes/services/marca_service.php");
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "includes/models/marca_model.php");
use Firebase\JWT\JWT;

class MarcaController extends WP_REST_Controller {
    protected $service;
    protected $model;

    public function __construct() {
        $this->model = new MarcaModel();
        $this->service = new MarcaService($this->model);
    }

    public function record_routes() {
        $namespace = 'api/v1';
        $base = 'marca';

        // 1. Listar todas as marcas (GET /api/v1/marca)
        register_rest_route($namespace, '/' . $base, array(
            array(
                'methods'             => WP_REST_Server::READABLE, // GET
                'callback'            => array($this, 'read'),
                'permission_callback' => array($this, 'verifyopen'),
            ),
            // 2. Criar nova marca (POST /api/v1/marca)
            array(
                'methods'             => WP_REST_Server::CREATABLE, // POST
                'callback'            => array($this, 'create'),
                'permission_callback' => array($this, 'verifyopen'),
            ),
        ));

        // Rotas com ID: /api/v1/marca/{id}
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', array(
            // 3. Obter marca por ID (GET /api/v1/marca/{id})
            array(
                'methods'             => WP_REST_Server::READABLE, // GET
                'callback'            => array($this, 'read_by_id'),
                'permission_callback' => array($this, 'verifyopen'),
            ),
            // 4. Atualizar marca (PUT / PATCH / POST)
            array(
                'methods'             => WP_REST_Server::EDITABLE, // PUT / PATCH / POST
                'callback'            => array($this, 'update'),
                'permission_callback' => array($this, 'verifyopen'),
            ),
            // 5. Excluir marca (DELETE /api/v1/marca/{id})
            array(
                'methods'             => WP_REST_Server::DELETABLE, // DELETE
                'callback'            => array($this, 'delete'),
                'permission_callback' => array($this, 'verifyopen'),
            ),
        ));
    }

    /**
     * READ - Listar marcas com suporte a paginação
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

            $marcas = (object)$this->model->read($params_data, $page, $per_page, $orders = array('id' => 'desc'));

            $response = new WP_REST_Response($marcas->data, 200);
            $response->header('x-wp-total', $marcas->total);
            $totalPages = ($per_page > 0) ? ceil($marcas->total / $per_page) : 1;
            $response->header('x-wp-totalpages', $totalPages);

            if (method_exists($this->service, 'after_read')) {
                $this->service->after_read($response, $params_data, $page, $per_page);
            }
        } catch (Exception $erro) {
            $response = new WP_REST_Response(['message' => 'Erro ao listar marcas'], 400);
        }
        return $response;
    }

    /**
     * READ BY ID - Buscar uma marca específica por ID
     */
    public function read_by_id($request) {
        $response = null;
        try {
            $id = intval($request['id']);

            if (method_exists($this->service, 'before_read_by_id')) {
                $this->service->before_read_by_id($id);
            }

            $marca = $this->model->read_by_id($id);

            if ($marca) {
                $response = new WP_REST_Response($marca, 200);
                if (method_exists($this->service, 'after_read_by_id')) {
                    $this->service->after_read_by_id($response, $id);
                }
            } else {
                $response = new WP_REST_Response(['message' => 'Marca não encontrada'], 404);
            }
        } catch (Exception $erro) {
            $response = new WP_REST_Response(['message' => 'Erro ao buscar marca'], 400);
        }
        return $response;
    }

    /**
     * CREATE - Cadastrar uma nova marca
     */
    public function create($request) {
        $response = null;
        try {
            $params = $request->get_json_params();
            if (empty($params)) {
                $params = $request->get_params();
            }

            $nome = isset($params['nome']) ? sanitize_text_field($params['nome']) : '';

            if (empty($nome)) {
                return new WP_REST_Response(['message' => 'O campo "nome" é obrigatório.'], 400);
            }

            if (method_exists($this->service, 'before_create')) {
                $this->service->before_create($params);
            }

            $dados = ['nome' => $nome];
            $nova_marca = $this->model->create($dados);

            if ($nova_marca) {
                $response = new WP_REST_Response($nova_marca, 201);
                if (method_exists($this->service, 'after_create')) {
                    $this->service->after_create($response, $params);
                }
            } else {
                $response = new WP_REST_Response(['message' => 'Erro ao inserir marca no banco de dados'], 500);
            }
        } catch (Exception $erro) {
            $response = new WP_REST_Response(['message' => $erro->getMessage()], 400);
        }
        return $response;
    }

    /**
     * UPDATE - Atualizar dados da marca por ID
     */
    public function update($request) {
        $response = null;
        try {
            $id = intval($request['id']);
            $params = $request->get_json_params();
            if (empty($params)) {
                $params = $request->get_params();
            }

            $marca_existente = $this->model->read_by_id($id);
            if (!$marca_existente) {
                return new WP_REST_Response(['message' => 'Marca não encontrada para atualização'], 404);
            }

            $nome = isset($params['nome']) ? sanitize_text_field($params['nome']) : $marca_existente['nome'];

            if (method_exists($this->service, 'before_update')) {
                $this->service->before_update($id, $params);
            }

            $dados = ['nome' => $nome];
            $marca_atualizada = $this->model->update($id, $dados);

            if ($marca_atualizada) {
                $response = new WP_REST_Response($marca_atualizada, 200);
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
     * DELETE - Excluir uma marca por ID
     */
    public function delete($request) {
        $response = null;
        try {
            $id = intval($request['id']);

            $marca_existente = $this->model->read_by_id($id);
            if (!$marca_existente) {
                return new WP_REST_Response(['message' => 'Marca não encontrada para exclusão'], 404);
            }

            if (method_exists($this->service, 'before_delete')) {
                $this->service->before_delete($id);
            }

            $excluido = $this->model->delete($id);

            if ($excluido) {
                $response = new WP_REST_Response([
                    'message' => 'Marca excluída com sucesso',
                    'id'      => $id
                ], 200);
                if (method_exists($this->service, 'after_delete')) {
                    $this->service->after_delete($response, $id);
                }
            } else {
                $response = new WP_REST_Response(['message' => 'Falha ao excluir marca'], 400);
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

$results_marca_controller = new MarcaController();
add_action('rest_api_init', array($results_marca_controller, 'record_routes'));
?>
