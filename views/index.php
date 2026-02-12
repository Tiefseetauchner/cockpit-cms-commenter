<kiss-container class="kiss-margin">

  <ul class="kiss-breadcrumbs">
    <li><a href="<?php echo $this->route('/comments')?>"><?php echo t('Comments')?></a></li>
  </ul>

  <vue-view>

    <template>
      <comment-model-comments></comment-model-comments>
    </template>

    <script type="module">

      export default {
        components: {
          'comment-model-comments': 'commenter:assets/vue-components/comment-model-comments.js'
        }
      }

    </script>

  </vue-view>

</kiss-container>

<?php $this->start('app-side-panel') ?>

<h2 class="kiss-size-4"><?php echo t('Comments') ?></h2>

<kiss-navlist>
  <ul>
    <li>
      <a class="kiss-link-muted kiss-flex kiss-flex-middle kiss-text-bold" href="<?php echo $this->route('/comments') ?>">
        <kiss-svg class="kiss-margin-small-right" src="<?php echo $this->base('commenter:icon.svg') ?>" width="20" height="20"><canvas width="20" height="20"></canvas></kiss-svg>
        <?php echo t('Overview') ?>
      </a>
    </li>
    <li>
      <a class="kiss-link-muted kiss-flex kiss-flex-middle" href="<?php echo $this->route('/comments/settings') ?>">
        <icon class="kiss-margin-small-right">settings</icon>
        <?php echo t('Settings') ?>
      </a>
    </li>
  </ul>
</kiss-navlist>

<div class="kiss-margin" id="commenter-aside"></div>

<kiss-navlist>
  <ul>
    <li class="kiss-nav-header kiss-margin-top kiss-margin-xsmall-bottom"><?php echo t('Hey there!') ?></li>
    <li>
      I'm sorry for being kind of intrusive here, but this is really an alpha addon. So I wanted to make this clear. <br />
      If you want to contribute, please do so at https://github.com/tiefseetauchner/cockpit-cms-commenter <br /><br />
      Also, I'm very much new to both Cockpit CMS itself and Vue.js, so I'm sure there's improvements to be made. For example the icon is atrocious. Happy to take any help I can get! <br /><br />
      Thanks for using! Best, Lena &lt;3
    </li>
  </ul>
</kiss-navlist>

<?php $this->end('app-side-panel') ?>
