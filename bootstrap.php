<?php

// update configuration
// this is an awful hack and I hate it. Please figure out how to correctly extend the config.
$defaultConfig = [
    'commenter' => [
        'model' => 'comments',
        'requireEmail' => false,
        'publishByDefault' => true,
        'email' => null,
    ],
];
if (isset($this['commenter'])) {
    $this['commenter'] = array_merge($defaultConfig['commenter'], $this['commenter']);
} else {
    $this['commenter'] = $defaultConfig['commenter'];
}

$this->on(
    'app.api.request', function () {
        include __DIR__.'/api.php';
    }
);

$this->on(
    'app.admin.init', function () {
        include __DIR__.'/admin.php';
    }
);