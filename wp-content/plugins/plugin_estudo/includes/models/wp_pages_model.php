<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    
class WPPagesModel {
    private $wpdb;

    public function read($params_data, $page = 1, $per_page = 10, $orders = array()) {
        $result = null;
        try {
            $slug = isset($params_data['slug']) ? sanitize_text_field($params_data['slug']) : '';

            $args = array(
                'post_type'      => 'page',
                'post_status'    => 'publish',
                'posts_per_page' => $per_page,
                'paged'          => $page,
                'orderby'        => 'title',
                'order'          => 'ASC',
            );

            if (!empty($slug)) {
                $args['name'] = $slug;
            }

            $query = new WP_Query($args);
            $pages = $query->posts;

            $args_count = $args;
            $args_count['posts_per_page'] = -1;
            $args_count['paged'] = 1;
            $query_count = new WP_Query($args_count);
            $pages_count = $query_count->found_posts;
            
            $page_list = array();
            foreach ($pages as $p) {
                $page_data = array(
                    'id'                => $p->ID,
                    'name'              => $p->post_title,
                    'slug'              => $p->post_name,
                    'description'       => $this->format_content($p->post_content),
                    'short_description' => $p->post_excerpt,
                    'date_created'      => $p->post_date,
                    'author'            => $p->post_author,
                    'parent'            => $p->post_parent,
                    'thumbnail'         => $this->get_page_thumbnail_src($p->ID),
                );
                $page_list[] = $page_data;
            }
            
            $result = array("data" => $page_list, "total" => $pages_count);
        } catch (Exception $erro) {
        }
        return $result;
    }

    public function read_by_id($id) {
        $result = null;
        try {
            $p = get_post($id);
            if ($p && $p->post_type === 'page' && $p->post_status === 'publish') {
                $page_data = array(
                    'id'                => $p->ID,
                    'name'              => $p->post_title,
                    'slug'              => $p->post_name,
                    'description'       => $this->format_content($p->post_content),
                    'short_description' => $p->post_excerpt,
                    'date_created'      => $p->post_date,
                    'author'            => $p->post_author,
                    'parent'            => $p->post_parent,
                    'thumbnail'         => $this->get_page_thumbnail_src($p->ID),
                );
                $result = $page_data;
            }
        } catch (Exception $erro) {}
        
        return $result;
    }

    /**
     * Processa o conteudo do post/pagina executando filtros do WordPress (Gutenberg blocks, shortcodes, etc.)
     */
    private function format_content($content) {
        if (empty($content)) {
            return '';
        }
        return apply_filters('the_content', $content);
    }

    public function get_page_thumbnail_src($page_id) {
        $thumbnail_id = get_post_thumbnail_id($page_id);
        if ($thumbnail_id) {
            $thumbnail_src = wp_get_attachment_image_src($thumbnail_id, 'full');
            return isset($thumbnail_src[0]) ? $thumbnail_src[0] : '';
        }
        return '';
    }
}
?>