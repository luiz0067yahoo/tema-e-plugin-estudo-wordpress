<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    
class WPCategoriesModel {
    private $wpdb;
    public function read($params_data,$page=1,$per_page=10,$orders= array()) {
        $result=null;
        try {
            $uncategorized = get_term_by('name', 'Sem categoria', 'category');
            $uncategorized_id = $uncategorized->term_id;
            $offset = ($page - 1) * $per_page; // Correção: Definir o offset corretamente
            $args = array(
                //'taxonomy' => 'product_cat',
                'taxonomy' => 'category',
                'hide_empty' => false,
                'exclude' => $uncategorized_id, 
                'number' => $per_page,
                'offset' => $offset,                
                'orderby' => 'id',
            );
            
            if(isset($params_data['slug'])){
                $args['slug'] = $params_data['slug'];
            }
            $categories_count = 0;
            $categories = get_terms($args);
            
            $categorie_list = array();
            foreach ($categories as $categorie) {
                $category_image = $this->get_term_thumbnail($categorie->term_id);
                $categorie_data = array(
                    'id' => $categorie->term_id,
                    'name' => $categorie->name,
                    'slug' => $categorie->slug,
                    'description' => $categorie->description,
                    'thumbnail' => $category_image,
                );
                $categorie_list[] = $categorie_data;
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