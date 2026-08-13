<?php
    class ServiceApi{
        protected $model;

        public function __construct($model) {
            $this->model=$model;
        }

        public function before_read($params_data,$pg,$per_page){

        }

        public function after_read($response,$params_data,$pg,$per_page){
            
        }

        public function before_read_by_id($id){

        }

        public function after_read_by_id($response,$id){

        }
       
        public function before_create($params_data){
            
        }

        public function after_create($response,$params_data){
           
        }

        public function before_update($id,$params_data){

        }

        public function after_update($response,$id,$params_data){

        }
    
        public function before_delete($id){

        }

        public function after_delete($response,$id){

        }
    
        public function before_verify(){

        }

        public function after_verify($response){

        }
    }
?>