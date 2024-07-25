<?php

$this->on(
    'app.api.request', function () {
        include __DIR__.'/api.php';
    }
);

// Extend the default configuration with default values for the commenter module
$this.on(
    $this->on(
        'app.config.init', function ($config) {
    
            $defaultConfig = [
                'commenter' => [
                    'model' => 'comments',
                    'requireEmail' => false,
                    'publishByDefault' => true,
                    'email' => null,
                ],
            ];

            array_merge_recursive($config, $defaultConfig);
    
        }
    )
);