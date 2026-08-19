<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    
class WPProductsModel {
    private $wpdb;
    public function read($params_data,$page=1,$per_page=10,$orders= array()) {
        $result=null;
        try {
            $category_slug = isset($params_data['category']) ? sanitize_text_field($params_data['category']) : '';
            $category = get_term_by('slug', $category_slug, 'product_cat'); // Obter a categoria pelo slug
            $category_id = $category ? $category->term_id : 0;
            $slug=isset($params_data['slug'])?$params_data['slug']:'';
            $args = array(
                'name' => $slug,
                'orderby' => 'name', // Adicionando o parâmetro de ordenação
                'category' => [$category_slug ],
                'status' => 'publish',
                'limit' => $per_page,
                'page' => $page,
            );
            $args_count = array(
                'name' => $slug,
                'category' =>  [$category_slug ],
                'status' => 'publish',
                'limit' => -1,
            );
            $products_count = count(wc_get_products($args_count));
            $products = wc_get_products($args);
            
            $product_list = array();
            foreach ($products as $product) {
                $product_data = array(
                    'id' => $product->get_id(),
                    'name' => $product->get_name(),
                    'slug' => $product->get_slug(),
                    'description' => $product->get_description(),
                    'short_description' => $product->get_short_description(),
                    'date_created' => $product->get_date_created(),
                    'regular_price' => $product->get_regular_price(),
                    'weight' => $product->get_weight(),
                    'dimensions' => $this->get_product_dimensions($product), // Adicione esta linha
                    'attributes' => $this->get_product_attributes($product),
                    'images' => $this->get_product_images($product),
                    'thumbnail' => $this->get_product_thumbnail_src($product) ,
                );
                $product_list[] = $product_data;
            }
            $result = ["data"=>$product_list,"total"=>$products_count];
        } catch (Exception $erro) {
        }
        return $result;
    }

    public function read_by_id($id) {
        $result=null;
        try {
            $product = wc_get_product($id);
            $product_data = array(
                'id' => $product->get_id(),
                'name' => $product->get_name(),
                'slug' => $product->get_slug(),
                'description' => $product->get_description(),
                'short_description' => $product->get_short_description(),
                'date_created' => $product->get_date_created(),
                'regular_price' => $product->get_regular_price(),
                'weight' => $product->get_weight(),
                'dimensions' => $this->get_product_dimensions($product), // Adicione esta linha
                'attributes' => $this->get_product_attributes($product),
                'images' => $this->get_product_images($product),
                'thumbnail' => $this->get_product_thumbnail_src($product) ,
            );
            $result=$product_data;
        }
        catch(Exception $erro){}
        return $result;
        
    }
        
    public function get_product_images($product) {
        $product_images = array();
        if ($product) {
            $attachment_ids = $product->get_gallery_image_ids();
            foreach ($attachment_ids as $attachment_id) {
                $image_data = wp_get_attachment_image_src($attachment_id, 'full');
                $product_images[] = array(
                    'id' => $attachment_id,
                    'src' => $image_data[0],
                    'alt' => get_post_meta($attachment_id, '_wp_attachment_image_alt', true),
                );
            }
        }
        return $product_images;
    }

    public function get_product_attributes($product) {
        $attributes = $this->get_product_attributes_sql($product->get_id());
        return $attributes;
    }

    public function get_product_attributes_sql($product_id) {
        global $wpdb;
        $attributes= $wpdb->get_results(
            $wpdb->prepare(
                "SELECT DISTINCT pm.meta_key, pm.meta_value
                FROM {$wpdb->postmeta} pm
                WHERE pm.post_id = %d
                AND pm.meta_key LIKE '_product_attributes'",
                $product_id
            ),
            ARRAY_A
        );
        $unserialized_data = unserialize($attributes[0]["meta_value"]);
        $product_attributes=[];
        foreach ($unserialized_data as $attribute) {
            $product_attributes[] = $attribute;
        }             
        return $product_attributes;
    }

    public function get_product_dimensions($product) {
        $dimensions = array(
            'length' => $product->get_length(),
            'width' => $product->get_width(),
            'height' => $product->get_height(),
        );
        return $dimensions;
    }
    public function get_product_thumbnail_src($product) {
        $thumbnail_id = $product->get_image_id();
        $thumbnail_src = wp_get_attachment_image_src($thumbnail_id, 'full');
        return $thumbnail_src[0];
    }
}
?>