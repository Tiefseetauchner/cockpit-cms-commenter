<?php

namespace Commenter\Controller;

use App\Controller\App;
use ArrayObject;

class Comment extends App
{
    public function index()
    {
        if (!$this->isAllowed('commenter/view')) {
            return $this->stop(401);
        }

        return $this->render('commenter:views/index.php');
    }

    public function settings()
    {
        if (!$this->isAllowed('commenter/manage')) {
            return $this->stop(401);
        }

        return $this->render('commenter:views/settings.php');
    }

    public function models()
    {
        if (!$this->isAllowed('commenter/view')) {
            return $this->stop(401);
        }

        $models = $this->module('content')->models();
        $commentModels = [];

        foreach ($models as $model) {
            $meta = $model['meta']['commenter'] ?? null;

            if (!$meta || empty($meta['parentModel'])) {
                continue;
            }

            $parentModel = $meta['parentModel'];
            $parentLabel = $models[$parentModel]['label'] ?? $parentModel;

            $commentModels[] = [
                'name' => $model['name'],
                'label' => $model['label'] ?? $model['name'],
                'parentModel' => $parentModel,
                'parentLabel' => $parentLabel
            ];
        }

        return $commentModels;
    }

    public function create()
    {
        if (!$this->isAllowed('commenter/manage') || !$this->isAllowed('content/:models/manage')) {
            return $this->stop(401);
        }

        $parentModel = $this->app->param('model');

        if (!$parentModel) {
            $this->app->response->status = 412;
            return ['error' => 'Missing parent model'];
        }

        $models = $this->module('content')->models();

        if (!isset($models[$parentModel])) {
            $this->app->response->status = 404;
            return ['error' => "Model <{$parentModel}> not found"];
        }

        $commentModel = null;

        foreach ($models as $model) {
            $meta = $model['meta']['commenter'] ?? null;
            if ($meta && ($meta['parentModel'] ?? null) === $parentModel) {
                $commentModel = $model;
                break;
            }
        }

        if ($commentModel) {
            return $commentModel;
        }

        $cfg = $this->app['commenter'] ?? [];
        $prefix = $cfg['modelPrefix'] ?? 'comments_';
        $group = $cfg['modelGroup'] ?? 'Comments';
        

        $commentModelName = $prefix.$parentModel;

        if ($this->app->helper('content.model')->exists($commentModelName)) {
            $this->app->response->status = 409;
            return ['error' => "Model <{$commentModelName}> already exists"];
        }

        $parentLabel = $models[$parentModel]['label'] ?? $parentModel;

        $commentModel = [
            'name' => $commentModelName,
            'label' => "{$parentLabel} Comments",
            'info' => "Comments for {$parentLabel}",
            'type' => 'collection',
            'fields' => [
                [
                    'name' => 'username',
                    'type' => 'text',
                    'label' => 'Username',
                    'info' => '',
                    'group' => '',
                    'i18n' => false,
                    'required' => true,
                    'multiple' => false,
                    'meta' => [],
                    'opts' => [
                        'multiline' => false,
                        'showCount' => true,
                        'readonly' => false,
                        'placeholder' => null,
                        'minlength' => null,
                        'maxlength' => null,
                        'list' => null
                    ]
                ],
                [
                    'name' => 'email',
                    'type' => 'text',
                    'label' => 'Email',
                    'info' => '',
                    'group' => '',
                    'i18n' => false,
                    'required' => false,
                    'multiple' => false,
                    'meta' => [],
                    'opts' => [
                        'multiline' => false,
                        'showCount' => true,
                        'readonly' => false,
                        'placeholder' => null,
                        'minlength' => null,
                        'maxlength' => null,
                        'list' => null
                    ]
                ],
                [
                    'name' => 'message',
                    'type' => 'text',
                    'label' => 'Message',
                    'info' => '',
                    'group' => '',
                    'i18n' => false,
                    'required' => true,
                    'multiple' => false,
                    'meta' => [],
                    'opts' => [
                        'multiline' => true,
                        'showCount' => true,
                        'readonly' => false,
                        'placeholder' => null,
                        'minlength' => null,
                        'maxlength' => null,
                        'list' => null
                    ]
                ],
                [
                    'name' => 'parent',
                    'type' => 'contentItemLink',
                    'label' => 'Parent',
                    'info' => '',
                    'group' => '',
                    'i18n' => false,
                    'required' => true,
                    'multiple' => false,
                    'meta' => [],
                    'opts' => [
                        'link' => $parentModel,
                        'filter' => null,
                        'display' => null
                    ]
                ],
                [
                    'name' => 'reviewed',
                    'type' => 'boolean',
                    'label' => 'Reviewed',
                    'info' => '',
                    'group' => '',
                    'i18n' => false,
                    'required' => false,
                    'multiple' => false,
                    'meta' => [],
                    'opts' => []
                ],
                [
                    'name' => 'created',
                    'type' => 'text',
                    'label' => 'Created',
                    'info' => '',
                    'group' => '',
                    'i18n' => false,
                    'required' => false,
                    'multiple' => false,
                    'meta' => [],
                    'opts' => [
                        'multiline' => false,
                        'showCount' => true,
                        'readonly' => true,
                        'placeholder' => null,
                        'minlength' => null,
                        'maxlength' => null,
                        'list' => null
                    ]
                ]
            ],
            'preview' => [],
            'group' => $group,
            'meta' => [
                'commenter' => [
                    'parentModel' => $parentModel
                ]
            ],
            'color' => '#f2a654',
            'revisions' => false,
        ];

        $commentModel = $this->module('content')->saveModel($commentModelName, $commentModel);

        return $commentModel;
    }
}
