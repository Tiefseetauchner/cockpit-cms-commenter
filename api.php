<?php

$this->on(
    'restApi.config', function ($restApi) {

        $restApi->addEndPoint(
            '/content/comments', [

            /**
            * @OA\Post(
            *     path="/content/comments",
            *     tags={"content"},
            *     @OA\RequestBody(
            *         description="Comment data",
            *         required=true,
            *         @OA\JsonContent(
            *             type="object",
            *             @OA\Property(property="data",     type="object",
            *                 @OA\Property(property="username", type="string"),
            *                 @OA\Property(property="email",    type="string"),
            *                 @OA\Property(property="message",  type="string"),
            *                 @OA\Property(property="parentId", type="string")
            *             )
            *         )
            *     ),
            *     @OA\OpenApi(
            *         security={
            *             {"api_key": {}}
            *         }
            *     ),
            *     @OA\Response(response="200",      description="Saved comment", @OA\JsonContent()),
            *     @OA\Response(response="404",      description="Model not found"),
            *     @OA\Response(response="401",      description="Unauthorized"),
            *     @OA\Response(response="412",      description="Comment data is missing")
            * )
            */

            'POST' => function ($params, $app) {

                $saveToModel = $this['commenter']['model'];

                $model = $app->module('content')->model($saveToModel);
                $data  = $app->param('data');

                if (!$model) {
                    $app->response->status = 404;
                    return ['error' => "Model <{$saveToModel}> not found"];
                }

                if (!$data  
                    || !is_array($data)  
                    || !isset($data['username'])  
                    || $data['username'] == ""  
                    || !isset($data['message'])  
                    || $data['message'] == ""  
                    || !isset($data['parentId'])
                    || ($this['commenter']['requireEmail'] && !isset($data['email']))
                ) {
                    $app->response->status = 412;
                    return ['error' => 'Comment data is missing or incomplete'];
                }

                if (isset($data['parentId']) && $data['parentId']) {
                    $data['parent'] = [
                        '_id' => $data['parentId'],
                    ];
                    unset($data['parentId']);
                }

                $default = array_merge(
                    $app->module('content')->getDefaultModelItem('comments'), [
                        '_state' => $this['commenter']['publishByDefault'] ? 1 : 0,
                        'created' => time(),
                        'reviewed' => false
                    ]
                );

                $data = array_merge($default, $data);

                $allowedKeys = array_merge(['_id'], array_keys($default));

                foreach (array_keys($data) as $key) {
                    if (!in_array($key, $allowedKeys)) {
                        unset($data[$key]);
                    }
                }

                $item = $app->module('content')->saveItem($saveToModel, $data, ['user' => $app->helper('auth')->getUser()]);
            
                if ($this['commenter']['email'] != null) {
                    $emailBody = "{$data['username']}";

                    if (empty($data['email'])) {
                        $emailBody .= " ";
                    } else {
                        $emailBody .= " ({$data['email']}) ";
                    }
                    
                    $emailBody .= "wrote:\n{$data['message']}\n\nAccept/Delete: {$this['commenter']['email']['commentManageUrl']}{$saveToModel}/{$item['_id']}";
                    
                    mail(
                        $this['commenter']['email']['reviewer'], 
                        'New comment', 
                        $emailBody, 
                        array("From" => $this['commenter']['email']['from'])
                    );
                }

                return $item;
            }
            ]
        );
    }
);
