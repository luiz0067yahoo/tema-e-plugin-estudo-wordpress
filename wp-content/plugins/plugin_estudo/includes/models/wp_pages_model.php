<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    
class WPPagesModel {
    private $wpdb;

    public function read($params_data, $page = 1, $per_page = 10, $orders = array()) {
        $result = null;
        try {
            $slug = isset($params_data['slug']) ? sanitize_text_field($params_data['slug']) : '';
            $search = isset($params_data['search']) ? sanitize_text_field($params_data['search']) : (isset($params_data['s']) ? sanitize_text_field($params_data['s']) : '');

            $pages = array();
            $pages_count = 0;

            if (!empty($slug)) {
                $page_by_path = get_page_by_path($slug, OBJECT, 'page');
                if ($page_by_path && $page_by_path->post_status === 'publish') {
                    $pages = array($page_by_path);
                    $pages_count = 1;
                } else {
                    $args = array(
                        'post_type'      => 'page',
                        'post_status'    => 'publish',
                        'pagename'       => $slug,
                        'posts_per_page' => 1,
                    );
                    $query = new WP_Query($args);
                    $pages = $query->posts;
                    $pages_count = count($pages);
                }
            } else {
                $default_orderby = !empty($search) ? 'date' : 'title';
                $default_order = !empty($search) ? 'DESC' : 'ASC';
                $orderby = isset($params_data['orderby']) ? sanitize_text_field($params_data['orderby']) : $default_orderby;
                $order = isset($params_data['order']) ? sanitize_text_field($params_data['order']) : $default_order;

                $args = array(
                    'post_type'      => 'page',
                    'post_status'    => 'publish',
                    'posts_per_page' => $per_page,
                    'paged'          => $page,
                    'orderby'        => $orderby,
                    'order'          => $order,
                );
                if (!empty($search)) {
                    $args['s'] = $search;
                }
                $query = new WP_Query($args);
                $pages = $query->posts;
                $pages_count = $query->found_posts;
            }
            
            $page_list = array();
            foreach ($pages as $p) {
                $page_data = array(
                    'id'                => $p->ID,
                    'type'              => 'page',
                    'name'              => $p->post_title,
                    'slug'              => $p->post_name,
                    'description'       => $this->format_content($p->post_content),
                    'short_description' => $p->post_excerpt,
                    'date_created'      => $p->post_date,
                    'author'            => $p->post_author,
                    'parent'            => $p->post_parent,
                    'thumbnail'         => $this->get_page_thumbnail_src($p->ID),
                    'edit_url'          => admin_url('post.php?post=' . $p->ID . '&action=edit'),
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
                    'edit_url'          => admin_url('post.php?post=' . $p->ID . '&action=edit'),
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