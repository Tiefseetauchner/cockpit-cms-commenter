# Cockpit CMS Comments addon

An extraordinarily simple addon for simplifying adding comments.

This addon provides an API at /api/content/comments with the following specification:

```yml
/content/comments:
  post:
    tags:
      - content
    requestBody:
      description: 'Comment data'
      required: true
      content:
        application/json:
          schema:
            properties:
              data:
                properties: { username: { type: string }, email: { type: string }, message: { type: string }, parentId: { type: string }, parentModel: { type: string } }
                type: object
            type: object
    responses:
      '200':
        description: 'Saved comment'
        content:
          application/json:
            schema: {  }
      '404':
        description: 'Model not found'
      '401':​
        description: Unauthorized
      '412':​
        description: 'Comment data is missing'
```

You have to adjust the configuration if you want to receive an email every time a comment is added:

config.php:

```php
<?php

return [
    'commenter' => [
        'email' => [
            'reviewer' => '<your@email.address>',
            'from' => '<sender@of.email>',
            'commentManageUrl' => 'https://your.domain.tld/path/to/cockpit/content/collection/item/',
        ],
    ]
];
```

Other configuration includes:
- `modelPrefix`: Prefix for auto-created comment models (default `comments_`)
- `modelGroup`: Group name for auto-created comment models (default `Comments`)
- `requireEmail`: requires email to be submitted
- `publishByDefault`: publishes the model by default so you can write your own management interface if you wanted to. The field "reviewed" is set to false and can be used as an indicator

Comment models are now created automatically from the Comments settings screen, and are linked to a parent content model.
