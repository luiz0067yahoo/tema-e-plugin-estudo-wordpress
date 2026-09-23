<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    
class WPPostsDataModel {
    private $wpdb;

    public function read($params_data, $page = 1, $per_page = 10, $orders = array()) {
        $result = null;
        try {
            $category_slug = isset($params_data['category']) ? sanitize_text_field($params_data['category']) : '';
            $slug = isset($params_data['slug']) ? sanitize_text_field($params_data['slug']) : '';
            $search = isset($params_data['search']) ? sanitize_text_field($params_data['search']) : (isset($params_data['s']) ? sanitize_text_field($params_data['s']) : '');
            $post_type = isset($params_data['post_type']) ? sanitize_text_field($params_data['post_type']) : '';

            // Se houver pesquisa ativa e nenhum post_type explícito for solicitado, busca tanto em posts quanto em páginas
            $types = array('post');
            if (!empty($post_type)) {
                $types = array_map('trim', explode(',', $post_type));
            } elseif (!empty($search)) {
                $types = array('post', 'page');
            }

            // Ordenação: quando for pesquisa, ordena por data decrescente (mais recentes primeiro)
            $default_orderby = !empty($search) ? 'date' : 'title';
            $default_order = !empty($search) ? 'DESC' : 'ASC';
            $orderby = isset($params_data['orderby']) ? sanitize_text_field($params_data['orderby']) : $default_orderby;
            $order = isset($params_data['order']) ? sanitize_text_field($params_data['order']) : $default_order;

            // Configurando os argumentos para WP_Query
            $args = array(
                'post_type'      => $types,
                'post_status'    => 'publish',
                'posts_per_page' => $per_page,
                'paged'          => $page,
                'orderby'        => $orderby,
                'order'          => $order,
            );

            if (!empty($search)) {
                $args['s'] = $search;
            }

            if (!empty($slug)) {
                $args['name'] = $slug;
            }

            if (!empty($category_slug)) {
                if (is_numeric($category_slug)) {
                    $args['cat'] = intval($category_slug);
                } else {
                    $args['category_name'] = $category_slug;
                }
            }

            $query = new WP_Query($args);
            $posts = $query->posts;

            // Query apenas para contagem total
            $args_count = $args;
            $args_count['posts_per_page'] = -1;
            $args_count['paged'] = 1;
            $query_count = new WP_Query($args_count);
            $posts_count = $query_count->found_posts;
            
            $post_list = array();
            foreach ($posts as $post) {
                $post_data = array(
                    'id'                => $post->ID,
                    'type'              => $post->post_type,
                    'name'              => $post->post_title,
                    'slug'              => $post->post_name,
                    'description'       => $this->format_content($post->post_content),
                    'short_description' => $post->post_excerpt,
                    'date_created'      => $post->post_date,
                    'author'            => $post->post_author,
                    'images'            => $this->get_post_images($post->ID),
                    'thumbnail'         => $this->get_post_thumbnail_src($post->ID),
                    'edit_url'          => admin_url('post.php?post=' . $post->ID . '&action=edit'),
                );
                $post_list[] = $post_data;
            }
            
            $result = array("data" => $post_list, "total" => $posts_count);
        } catch (Exception $erro) {
            // Tratar erro se necessário
        }
        return $result;
    }

    public function read_by_id($id) {
        $result = null;
        try {
            $post = get_post($id);
            if ($post && $post->post_status === 'publish') {
                $post_data = array(
                    'id'                => $post->ID,
                    'name'              => $post->post_title,
                    'slug'              => $post->post_name,
                    'description'       => $this->format_content($post->post_content),
                    'short_description' => $post->post_excerpt,
                    'date_created'      => $post->post_date,
                    'author'            => $post->post_author,
                    'images'            => $this->get_post_images($post->ID),
                    'thumbnail'         => $this->get_post_thumbnail_src($post->ID),
                    'edit_url'          => admin_url('post.php?post=' . $post->ID . '&action=edit'),
                );
                $result = $post_data;
            }
        } catch (Exception $erro) {}
        
        return $result;
    }

    /**
     * Processa o conteudo do post executando filtros do WordPress (Gutenberg blocks, shortcodes, etc.)
     */
    private function format_content($content) {
        if (empty($content)) {
            return '';
        }
        return apply_filters('the_content', $content);
    }
        
    public function get_post_images($post_id) {
        $post_images = array();
        // Exemplo buscando imagens anexadas ao post (galeria padrão do WP)
        $attachments = get_posts(array(
            'post_type'      => 'attachment',
            'posts_per_page' => -1,
            'post_parent'    => $post_id,
            'post_mime_type' => 'image',
            'orderby'        => 'menu_order',
            'order'          => 'ASC'
        ));

        foreach ($attachments as $attachment) {
            $image_data = wp_get_attachment_image_src($attachment->ID, 'full');
            if ($image_data) {
                $post_images[] = array(
                    'id'  => $attachment->ID,
                    'src' => $image_data[0],
                    'alt' => get_post_meta($attachment->ID, '_wp_attachment_image_alt', true),
                );
            }
        }
        return $post_images;
    }

    public function get_post_thumbnail_src($post_id) {
        $thumbnail_id = get_post_thumbnail_id($post_id);
        if ($thumbnail_id) {
            $thumbnail_src = wp_get_attachment_image_src($thumbnail_id, 'full');
            return isset($thumbnail_src[0]) ? $thumbnail_src[0] : '';
        }
        return '';
    }
}
?>