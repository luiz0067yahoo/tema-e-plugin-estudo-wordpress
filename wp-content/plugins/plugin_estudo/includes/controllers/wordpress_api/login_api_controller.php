<?php
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "includes/services/login_api_service.php");
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "includes/models/user_login_model.php");
    require_once(plugin_dir_path(PLUGIN_FILE_URL) . "includes/models/wp_users_model.php");
    class LoginApiController extends WP_REST_Controller {
        protected $service;
        protected $model;
        protected $user;

        public function __construct() {
            $this->userLoginModel=new  UserLoginModel();
            $this->service=new LoginApiService($this->userLoginModel);
        }

        public function record_routes() {
            $namespace='api/v1';
            $base='login';
            register_rest_route($namespace, '/' . $base, array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array($this, 'login'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));
            $base='logout';
            register_rest_route($namespace, '/' . $base, array(
                array(
                    'methods'  => WP_REST_Server::CREATABLE,
                    'callback' => array($this, 'logout'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));
            $base='new_token';
            register_rest_route($namespace, '/' . $base, array(
                array(
                    'methods'  => WP_REST_Server::CREATABLE,
                    'callback' => array($this, 'newToken'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));
            $base='verify';
            register_rest_route($namespace, '/' . $base, array(
                array(
                    'methods'  => WP_REST_Server::CREATABLE,
                    'callback' => array($this, 'verify'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));
            $base='forgot';
            register_rest_route($namespace, '/' . $base, array(
                array(
                    'methods'  => WP_REST_Server::CREATABLE,
                    'callback' => array($this, 'forgot'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));
            $base='code';
            register_rest_route($namespace, '/' . $base, array(
                array(
                    'methods'  => WP_REST_Server::CREATABLE,
                    'callback' => array($this, 'validCodeResetPassword'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));
            $base='newPassword';
            register_rest_route($namespace, '/' . $base, array(
                array(
                    'methods'  => WP_REST_Server::CREATABLE,
                    'callback' => array($this, 'newPassword'),
                    'permission_callback' => array($this, 'verifyopen'),
                ),
            ));
        }

        public function encryptData($data, $key) {
            $cipherMethod = 'AES-256-CBC';
            $ivSize = openssl_cipher_iv_length($cipherMethod);
            $iv = openssl_random_pseudo_bytes($ivSize);
            $encrypted = openssl_encrypt($data, $cipherMethod, $key, 0, $iv);
            $result=$this->base64url_encode($iv . $encrypted);
            return $result;
        }
        
        public function decryptData($data, $key) {
            $cipherMethod = 'AES-256-CBC';
            $data = $this->base64url_decode($data);
            $ivSize = openssl_cipher_iv_length($cipherMethod);
            $iv = substr($data, 0, $ivSize);
            $encrypted = substr($data, $ivSize);
            $result=openssl_decrypt($encrypted, $cipherMethod, $key, 0, $iv);
            return $result;
        }
        
        public function getJWT($request) {
            try {
                $jwt = $request->get_header('Authorization');
                return $token = str_replace('Bearer ', '', $jwt);
            } catch (Exception $error) {
                return null;
            }
        }

        public function setDataToken($payload, $secretKey = JWT_SECRET_KEY, $algorithm = 'HS512') {
            if (empty($payload)) {
                throw new InvalidArgumentException('Payload inválido.');
            }

            if (!is_string($secretKey) || empty($secretKey)) {
                throw new InvalidArgumentException('Chave secreta inválida.');
            }

            $allowedAlgorithms = ['HS256', 'HS384', 'HS512']; // Adicione outros algoritmos permitidos conforme necessário

            if (!in_array($algorithm, $allowedAlgorithms)) {
                throw new InvalidArgumentException('Algoritmo inválido.');
            }

            // Criar o cabeçalho do JWT
            $header_base64_encode = $this->base64url_encode(json_encode(['alg' => $algorithm, 'typ' => 'JWT']));
            $payload_base64_encode = $this->base64url_encode(json_encode($payload));

            // Criar a assinatura do JWT
            $algorithmIndex = array_search($algorithm, $allowedAlgorithms);
            $algorithm_hash = ['sha256', 'sha384', 'sha512'];
            $signature = hash_hmac($algorithm_hash[$algorithmIndex], $header_base64_encode . '.' . $payload_base64_encode, $secretKey, true);
            $encodedSignature = $this->base64url_encode($signature);

            // Criar o token JWT concatenando o cabeçalho, payload e assinatura
            $jwtToken = $header_base64_encode . '.' . $payload_base64_encode . '.' . $encodedSignature;

            return $jwtToken;
        }

        public function base64url_encode($data) {
            $data=base64_encode($data);
            $data= strtr($data, '+', '-');
            $data= strtr($data, '/', '_');
            $data= rtrim($data, '=');
            return $data;
        }

        public function base64url_decode($data) {
            // Add padding to the base64 string if needed
            $padding = strlen($data) % 4;
            if ($padding) {
                $data .= str_repeat('=', 4 - $padding);
            }
        
            // Replace characters that were modified during encoding
            $data = strtr($data, '-_', '+/');
        
            // Decode the base64 string
            $decodedData = base64_decode($data);
        
            return $decodedData;
        }

        public function getDataToken($jwt, $secretKey = JWT_SECRET_KEY) {
            $decodedPayload = null;
            try {
                if (!empty($jwt)) {
                    $tokenParts = explode('.', $jwt);
                    if (count($tokenParts) === 3) {
                        $header = json_decode($this->base64url_decode($tokenParts[0]), true);
                        $payload = json_decode($this->base64url_decode($tokenParts[1]), true);
                        $signature = $tokenParts[2];
        
                        $algorithm = $header['alg'];
        
                        $allowedAlgorithms = ['HS256', 'HS384', 'HS512'];
                        if (!in_array($algorithm, $allowedAlgorithms)) {
                            throw new InvalidArgumentException('Algoritmo inválido!');
                        }
        
                        $algorithmIndex = array_search($algorithm, $allowedAlgorithms);
                        $algorithmHash = ['sha256', 'sha384', 'sha512'];
                        $computedSignature = hash_hmac($algorithmHash[$algorithmIndex], $tokenParts[0] . '.' . $tokenParts[1], $secretKey, true);
                        $computedSignatureBase64 =$this->base64url_encode($computedSignature);
                        if (hash_equals($signature, $computedSignatureBase64)) {
                            $decodedPayload = $payload;
                        } else {
                            throw new Exception('Token is invalid. Decoded data: ' . json_encode($decodedPayload));
                        }
                    } else {
                        throw new Exception('Erro: Token incompleto.');
                    }
                } else {
                    throw new Exception('Erro: JWT vazio ou indefinido.');
                }
            } catch (\Exception $e) {
                throw new Exception( 'Erro: ' . $e->getMessage());
            }
            return $decodedPayload;
        }
        
        public function getDataUserId($request) {
            $user_id=null;
            $jwt = $this->getJWT($request);
            if($jwt){
                $decoded_token = $this->getDataToken($jwt,$secret_Key=JWT_SECRET_KEY);
                $user_id = $decoded_token["user_id"];
            }
            $user_id= $this->decryptData($user_id,JWT_SECRET_KEY_2);
            return $user_id;
        }
        
        public function getDataSessionId($request) {
            $session_id=null;
            $jwt = $this->getJWT($request);
            if($jwt){
                $decoded_token = $this->getDataToken($jwt,$secret_Key=JWT_SECRET_KEY);
                $session_id = $decoded_token["session_id"];
            }
            $session_id=$this->decryptData($session_id,JWT_SECRET_KEY_2);
            return $session_id;
        }

        public function generateToken($user,$request) {
            $response=null;
            try {
                $jwt_old = $this->getJWT($request);
                $user_id_old= $this->getDataUserId($request);
                $session_id_old= $this->getDataSessionId($request);
                if (is_wp_error($user)) {
                    //$response = new WP_REST_Response(['message' => $user->get_error_message()], 400);
                    $response = new WP_REST_Response(['message' => "username or password inválid"], 400);                    
                }
                else{
                    $current_time = time();
                    $user_id=$user->ID;
                    $this->setLoginEnd($session_id_old,date('Y-m-d H:i:s',$current_time)); 
                    $userLogin=$this->setLoginStart($user_id,date('Y-m-d H:i:s',$current_time));
                    $session_id=$userLogin["id"];
                    $jwt = $this->setDataToken(
                        [
                            'session_id' => $this->encryptData($session_id,JWT_SECRET_KEY_2),  
                            'user_id' => $this->encryptData($user_id,JWT_SECRET_KEY_2),  
                            'iss' => 'https://luizbrogliatto.freedev.app/',
							'aud' => 'https://luizbrogliatto.freedev.app/',
                            'exp' => $current_time +JWT_TIME, // 10 minutos a partir do momento atual,
                        ],
                        JWT_SECRET_KEY, 
                        $algorithm = 'HS512'
                    );
                    $response= new WP_REST_Response(
                        [
                            'jwt' => $jwt ,
                            //'message' => 'Login successful!',
                            //'expires_at' => date('Y-m-d H:i:s', $current_time +JWT_TIME),
                        ]
                        , 200
                    );
                    $this->updateLoginToken($session_id,$jwt); 
                    $session_id=$this->getLastLoginStart($user_id)["id"];
                }
            }catch (Exception $erro) {
                $response = new WP_REST_Response(['message' => $erro->getMessage()], 400);
            }

            return $response;
        }

        public function login($request) {
            $response=null;
            try {
                $params_data = $request->get_params();
                $this->service->before_login($params_data); 
                $username = $params_data['username'];
                $password = $params_data['password'];
                $user = wp_authenticate($username, $password)->data;
                $this->user=$user;
                if($user->ID>0){
                    $response=$this->generateToken($user,$request);
                    $this->service->after_login($response,$request);
                } 
            } catch (Exception $erro) {
                $response = new WP_REST_Response(['message' => "username or password inválid"], 400);
                //$response = new WP_REST_Response(['message' => $erro->getMessage()], 400);
            }
            return $response;
        }

        public function validCodeResetPassword($request) {
             $response = null;
            try {
                $params_data = $request->get_params();
                $code = sanitize_text_field($params_data['code']);
                $login = sanitize_text_field($params_data['login']);
                $user = check_password_reset_key($code, $login);
                if (is_wp_error($user)) {
                    throw new Exception($user->get_error_message());
                }
                $response = new WP_REST_Response(['message' => 'code valid'], 200);
            } catch (Exception $error) {
                $response = new WP_REST_Response(['message' => 'code inválid or exprired'], 400);
                //$response = new WP_REST_Response(['message' => $error->getMessage()], 400);
            }
            return $response;
        }
        
        public function newPassword($request) {
             $response = null;
            try {
                $params_data = $request->get_params();
                $code = sanitize_text_field($params_data['code']);
                $login = sanitize_text_field($params_data['login']);
                $user = check_password_reset_key($code, $login);
                if (is_wp_error($user)) {
                    throw new Exception($user->get_error_message());
                }
                $new_password = sanitize_text_field($params_data['new_password']);
                reset_password($user, $new_password);
                $response = new WP_REST_Response(['message' => 'Password reset successful'], 200);
            } catch (Exception $error) {
                $response = new WP_REST_Response(['message' => 'code inválid or exprired'], 400);
                //$response = new WP_REST_Response(['message' => $error->getMessage()], 400);
            }
            return $response;
        }

        public function forgot($request) {
            $response=null;
            try {
                $params_data = $request->get_params();
                $this->service->before_forgot($params_data); 
                $user_email = sanitize_email($params_data['email']);
                if (!is_email($user_email)) {
                    throw new Exception('Invalid email address');
                }
                $user_data = $user = get_user_by('email', $user_email);
                //$user_data = (object)(new WPUsersModel())->read(['user_email'=>["=",$user_email]])["data"][0];
                $this->user=$user_data;
                if ($user_data) {
                    $key = get_password_reset_key($user_data);
                    $login_encoded=rawurlencode($user_data->user_login);
                    $url="/code/$key/$login_encoded";
                    $reset_link = site_url($url);
                    //$reset_link = site_url("wp-login.php?action=rp&key=$key&login=" . rawurlencode($user->user_login), 'login');
                    $subject = 'Redefinição de senha';

                    // Mensagem do e-mail
                    $message = "Olá " . $user->display_name . ",\n\n";
                    $message .= "Você solicitou a redefinição de senha. Clique no link abaixo para redefinir sua senha:\n\n";
                    $message .= $reset_link . "\n\n";
                    $message .= "Se você não solicitou a redefinição de senha, ignore este e-mail.\n\n";
                
                    // Cabeçalhos do e-mail
                    $headers = array('Content-Type: text/html; charset=UTF-8');
                
                    // Envia o e-mail
                    $result = wp_mail($user_email, $subject, $message, $headers);
                    if($result){
                        $response = new WP_REST_Response(['message' => "success send e-mail"], 200);        
                    }
                    else{
                        throw new Exception('Error not send email');
                    }
                    $this->service->after_forgot($response,$request);
                }else{
                    throw new Exception('not found user fo with email');
                }
            } catch (Exception $erro) {
                $response = new WP_REST_Response(['message' => 'verify your e-mail'], 400);
                //$response = new WP_REST_Response(['message' => $erro->getMessage()], 400);
            }
            return $response;
        }

        public function setLoginEnd($session_id,$time) {
            $result=null;
            try {
                $this->userLoginModel->update(
                    $session_id,
                    [
                        "end_login"=>$time,
                    ]
                );
            } catch (\Throwable $th) {
                
            }
            return $result;
        }
        
        public function getLastLoginStart($user_id) {
            $result=null;
            try {
                $result=$this->userLoginModel->read(
                    $params_data=[
                        "user_id"=>$user_id,
                        "meta_key"=>"login_end",
                    ],
                    $pg=1,
                    $per_page=-1,
                    $orders= ["start_login"=>"desc"]
                )["data"][0];
            } catch (\Throwable $th) {
                
            }
            return $result;
        }
        
        public function setLoginStart($user_id,$time,$jwt="") {
            return $this->userLoginModel->create(
                [
                    "id_user"=>$user_id,
                    "start_login"=>$time,
                    "jwt"=>$jwt,
                ]
            );
        }

        public function updateLoginToken($session_id,$jwt) {
            $this->userLoginModel->update(
                $session_id,
                [
                    "jwt"=>$jwt,
                ]
            );
        }

        public function setLastLoginEnd($user_id,$time) {
            $user_login=$this->getLastLoginStart($user_id);
            $this->userLoginModel->update(
                $user_login["id"],
                ["end_login"=>$time,]
            );

        }
       
        public function verify($request) {
            $response = false;
            try {
                $user_id_token = $this->getDataUserId($request);
                $session_id = $this->getDataSessionId($request);
                //$user=get_userdata($user_id_token)->data;
                $user=get_user_by('ID', $user_id_token);
                $this->user=$user;
                $user_id=$this->user->id;
                if($user_id==$user_id_token){
                    $userLogin=$this->userLoginModel->read_by_id($session_id);
                    $loginStart = $userLogin["start_login"];
                    $loginStart = isset($loginStart)?(new DateTime($loginStart))->getTimestamp():0;
                    $loginEnd =  $userLogin["end_login"];
                    $loginEnd =  isset($loginEnd)?(new DateTime($loginEnd))->getTimestamp():0;
                    $expires_at = $loginStart + JWT_TIME;
                    $response = (
                        ($loginEnd<$loginStart)
                        &&
                        ($expires_at > time())
                    );
                }
            } catch (Exception $error) {
                throw new Exception($error->get_message());
            }
            return $response;
        }

        public function logout($request) {
            $response = null;
            try {
                $params_data = $request->get_params();
                $this->service->before_logout($params_data); 
                $user_id = $this->getDataUserId($request);
                $current_time = time();
                $this->setLastLoginEnd($user_id,date('Y-m-d H:i:s',$current_time));
                $response = new WP_REST_Response(['message' => 'Logout successful!'], 200);
                $this->service->after_logout($params_data,$response);
            } catch (Exception $error) {
                $response = new WP_REST_Response(['message' => 'Logout failed'], 400);
            }
            return $response;
        }

        
        public function newToken($request) {
            $response =null;
            try {
                $params_data = $request->get_params();
                $this->service->before_newToken($params_data); 
                $isValidToken=$this->verify($request);
                if($isValidToken){
                    $user=$this->user;
                    $response=$this->generateToken($user,$request);
                }
                else{
                    $response = new WP_REST_Response(['message' => 'token is invalid or expired'], 200);
                }
                $this->service->after_newToken($params_data,$response);
            } catch (Exception $error) {
                $response = new WP_REST_Response(['message' => $error->get_message()], 200);
            }
            return $response;
        }

        public function verifyopen($request) {return true;}
    }
    $results_controller = new LoginApiController();
    add_action('rest_api_init', array($results_controller, 'record_routes'));
    //$this->$wpdb->flush();
?>