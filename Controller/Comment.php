<?php

namespace Commenter\Controller;

use App\Controller\App;
use ArrayObject;

class Comment extends App
{
    public function index()
    {
        return $this->render('commenter:views/index.php');
    }
}