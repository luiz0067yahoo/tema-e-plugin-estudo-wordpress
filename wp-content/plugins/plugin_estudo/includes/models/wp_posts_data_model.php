<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    
class WPPostsDataModel {
    private $wpdb;

    public function read($params_data, $page = 1, $per_page = 10, $orders = array()) {
        $result = null;
        try {
            $category_slug = isset($params_data['category']) ? sanitize_text_field($params_data['category']) : '';
            $slug = isset($params_data['slug']) ? sanitize_text_field($params_data['slug']) : '';

            // Configurando os argumentos para WP_Query
            $args = array(
                'post_type'      => 'post',
                'post_status'    => 'publish',
                'posts_per_page' => $per_page,
                'paged'          => $page,
                'orderby'        => 'title',
                'order'          => 'ASC',
            );

            if (!empty($slug)) {
                $args['name'] = $slug;
            }

            if (!empty($category_slug)) {
                $args['category_name'] = $category_slug;
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
                    'name'              => $post->post_title,
                    'slug'              => $post->post_name,
                    'description'       => $post->post_content,
                    'short_description' => $post->post_excerpt,
                    'date_created'      => $post->post_date,
                    'author'            => $post->post_author,
                    'images'            => $this->get_post_images($post->ID),
                    'thumbnail'         => $this->get_post_thumbnail_src($post->ID),
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
                    'description'       => $post->post_content,
                    'short_description' => $post->post_excerpt,
                    'date_created'      => $post->post_date,
                    'author'            => $post->post_author,
                    'images'            => $this->get_post_images($post->ID),
                    'thumbnail'         => $this->get_post_thumbnail_src($post->ID),
                );
                $result = $post_data;
            }
        } catch (Exception $erro) {}
        
        return $result;
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