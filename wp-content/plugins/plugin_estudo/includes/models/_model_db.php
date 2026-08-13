<?php
require_once(plugin_dir_path(PLUGIN_FILE_URL) . "/vendor/autoload.php");
    
class ModelDB {
    private $wpdb;
    private $table;
    private $fields_names;

    public function __construct($table,$fields_names) {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->table = $table;
        $this->fields_names = $fields_names;
    }

    public function filter_params_data($params_data) {
        $params_data_filter = [];
        if(isset($params_data['id'])&& is_numeric($params_data['id']) && ctype_digit((string) $params_data['id']))
            $params_data_filter["id"]=$params_data['id'];
        foreach ($this->fields_names as $field_name) {
            if(isset($params_data[$field_name]))
                $params_data_filter[$field_name]=$params_data[$field_name];
        }
        return $params_data_filter;
    }

    public function create($params_data) {
        $inserted = $this->wpdb->insert(
            $this->wpdb->prefix . $this->table,
            $this->filter_params_data($params_data)
        );
        if ($inserted) {
            $last_id = $this->wpdb->insert_id;
            return $this->read_by_id($last_id);
        } else {
            return null; 
        }
    }

    public function update($id, $params_data) {
        $updated = $this->wpdb->update(
            $this->wpdb->prefix . $this->table,
            $this->filter_params_data($params_data),
            array('id' => $id)
        );
        if ($updated) {
            return $this->read_by_id($id);
        } else {
            return null; 
        }
    }

    public function read_by_id($id) {
        $result=$this->wpdb->get_row(
            $this->wpdb->prepare("SELECT * FROM {$this->wpdb->prefix}$this->table WHERE id = %d", [$id]),
            ARRAY_A
        );
        
        return $result;
    }

    public function read($params_data,$pg=1,$per_page=10,$orders= array()) {
        $result=null;
        $offset = ($pg - 1) * $per_page;
        $where = '';
        $params_data=$this->filter_params_data($params_data);
        $params_values= array();
        $fields = ltrim(join(",",$this->fields_names),', ');

        foreach ($params_data as $key => $value) {
            $operator="like";
            try{
                $obj='';
                if(is_array($value))
                    $obj=$value;
                else
                    $obj=json_decode($value);
                if(is_array($obj)){
                    $operator = $obj[0];
                    $value=$obj[1];
                }
                else
                    $value = "%$value%";
            }
            catch(Execption $erro){}
            $where .= " AND {$this->wpdb->prefix}$this->table.$key $operator %s ";
            array_push($params_values,$value);
        }
        $params_values_count=$params_values;
        if($per_page==-1){
            array_push($params_values,$offset);
            array_push($params_values,$per_page);
        }
        $where = ltrim($where, ' AND');
        $where=($where)?" where ".$where:'';  
        $order="";
        foreach ($orders as $key => $value) {
            $order .= ", {$this->wpdb->prefix}$this->table.$key $value";
        }
        $order = ltrim($order, ', ');
        $order=($order!='')?" order by ".$order:$order; 
        $sql_count="SELECT {$fields} FROM {$this->wpdb->prefix}$this->table {$where}";
        if($per_page==-1)
            $sql="SELECT {$fields} FROM {$this->wpdb->prefix}$this->table {$where} {$order}";
        else
            $sql="SELECT {$fields} FROM {$this->wpdb->prefix}$this->table {$where} {$order} LIMIT %d, %d";
        $result=[
            "data"=>$this->wpdb->get_results(
                $this->wpdb->prepare($sql_count,$params_values),
                ARRAY_A
            ),
            "total"=>$this->count($sql, $params_values_count),
        ];
        
        return $result;
    }

    public function count($sql, $params_values = array()) {
        global $wpdb;
        $sql = preg_replace('/\s*LIMIT\s+.*/i', '', $sql);
        //$sql = preg_replace('/SELECT.*?FROM/i', 'SELECT COUNT(*) count_query FROM', $sql);
        //$sql = preg_replace('/SELECT ROW.*?FROM/i', 'SELECT COUNT(*) count_query FROM', $sql);
        //$sql = preg_replace('/SELECT DISCTINCT.*?FROM/i', 'SELECT COUNT(*) count_query FROM', $sql);
        $sql = "SELECT COUNT(*) FROM (" . $sql . ") AS count_query";
        $count = $wpdb->get_var($wpdb->prepare($sql, $params_values));
        return $count;
    }

    public function delete($id) {
        $this->wpdb->delete(
            $this->wpdb->prefix . $this->table,
            array('id' => $id)
        );
        $deleted =$this->read_by_id($id);
        
        return ($deleted)?false:true;
    }
}

?>