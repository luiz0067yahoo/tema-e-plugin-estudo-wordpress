<?php
/**
 * Plugin Name:       Plugin Estudo
 * Plugin URI:        https://github.com/luiz0067yahoo/
 * Description:       plugin backend de tema estudo.
 * Version:           1.0
 * Requires at least: 7.0
 * Requires PHP:      8.0
 * Author:            Luiz Fernando Brogliatto Ferreira
 * Author URI:        https://github.com/luiz0067yahoo/
 * License:           CopyRight Luiz Fernando
 * Text Domain:       plugin-estudo
 * Network:           True
 *
 */

global $wpdb;//Váriavel global do wordpress para manipulação do banco de dados.

define( 'WP_DEBUG', true );// Ativa o modo de depuração do WordPress
define('WP_DEBUG_LOG', true);// Ativa o registro de erros em um arquivo de log
define('WP_DEBUG_DISPLAY', true);// Exibe os erros na tela
@ini_set('display_errors', 1);// Exibe os erros na tela

ini_set('display_errors', 1);// Exibe os erros na tela
ini_set('display_startup_errors', 1);// Exibe os erros de inicialização na tela
error_reporting(E_ALL & ~(E_WARNING | E_DEPRECATED));// Exibe todos os erros, exceto avisos e mensagens deprecatadas

define("PLUGIN_FILE_URL", __FILE__);// Define a constante PLUGIN_FILE_URL com o caminho do arquivo do plugin

date_default_timezone_set('America/Sao_Paulo');// Define o fuso horário padrão para São Paulo

add_action('init', function () {
    header("Access-Control-Allow-Origin: *");// Permite que qualquer origem acesse os recursos do plugin
    header("Access-Control-Allow-Methods: GET, OPTIONS");// Permite apenas os métodos GET e OPTIONS
    header("Access-Control-Allow-Headers: *");// Permite que qualquer cabeçalho seja enviado na requisição
});

//require_once(plugin_dir_path(__FILE__) . '.env.php');//variável de ambiente do plugin
//require_once(plugin_dir_path(__FILE__) . 'includes/config.php');//configurações do plugin
//require_once(plugin_dir_path(__FILE__) . 'includes/db/_migrate.php');//migrar banco de dados do plugin
//require_once(plugin_dir_path(__FILE__) . 'includes/controllers/_register_rest_route.php');//registrar rotas do plugin
$wpdb->flush();