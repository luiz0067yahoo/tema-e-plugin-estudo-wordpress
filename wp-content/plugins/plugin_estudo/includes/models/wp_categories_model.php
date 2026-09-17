<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    
class WPCategoriesModel {
    private $wpdb;
    public function read($params_data,$page=1,$per_page=100,$orders= array()) {
        $result=null;
        try {
            $uncategorized = get_term_by('name', 'Sem categoria', 'category');
            $uncategorized_id = $uncategorized ? $uncategorized->term_id : 0;
            
            $limit = intval($per_page);
            $number = ($limit <= 0 || $limit >= 100) ? 0 : $limit;
            $offset = ($number > 0 && $page > 1) ? ($page - 1) * $number : 0;
            $orderby = isset($params_data['orderby']) ? sanitize_text_field($params_data['orderby']) : (isset($orders['orderby']) ? $orders['orderby'] : 'id');
            $order = isset($params_data['order']) ? sanitize_text_field($params_data['order']) : (isset($orders['order']) ? $orders['order'] : 'ASC');

            $args = array(
                //'taxonomy' => 'product_cat',
                'taxonomy' => 'category',
                'hide_empty' => false,
                'number' => $number,
                'offset' => $offset,                
                'orderby' => $orderby,
                'order' => $order,
            );
            
            if ($uncategorized_id) {
                $args['exclude'] = array($uncategorized_id);
            }
            if(isset($params_data['slug'])){
                $args['slug'] = $params_data['slug'];
            }
            if(isset($params_data['parent'])){
                $args['parent'] = intval($params_data['parent']);
            }
            $categories_count = 0;
            $categories = get_terms($args);
            
            $categorie_list = array();
            if (!empty($categories) && !is_wp_error($categories)) {
                foreach ($categories as $categorie) {
                    $category_image = $this->get_term_thumbnail($categorie->term_id);
                    $categorie_data = array(
                        'id' => $categorie->term_id,
                        'name' => $categorie->name,
                        'slug' => $categorie->slug,
                        'description' => $categorie->description,
                        'count' => (int) $categorie->count,
                        'parent' => (int) $categorie->parent,
                        'thumbnail' => $category_image,
                    );
                    $categorie_list[] = $categorie_data;
                }
            }
            $categories_count=count($categorie_list);
            $result = ["data"=>$categorie_list,"total"=>$categories_count];
        } catch (Exception $erro) {
        }
        return $result;
    }

    public function read_by_id($id) {
        $result=null;
        try {
            $categorie = get_term($id, 'product_cat');
            $category_image = $this->get_term_thumbnail($categorie->term_id);
            $categorie_data = array(
                'id' => $categorie->term_id,
                'name' => $categorie->name,
                'slug' => $categorie->slug,
                'description' => $categorie->description,
                'thumbnail' => $category_image,
            );
            $result=$categorie_data;
        }
        catch(Exception $erro){}
        return $result;
    }
    
    public function get_term_thumbnail($id) {
        // Obtém a ID da imagem em destaque associada ao termo
        $thumbnail_id = get_term_meta($id, 'thumbnail_id', true);
        
        // Verifica se há uma ID de imagem em destaque
        if (!empty($thumbnail_id)) {
            // Obtém a URL da imagem em destaque com base na sua ID
            $thumbnail_url = wp_get_attachment_url($thumbnail_id);
            
            // Retorna a URL da imagem em destaque
            return $thumbnail_url;
        } else {
            // Retorna nulo se não houver imagem em destaque associada ao termo
            return null;
        }
    }
    
}
?>