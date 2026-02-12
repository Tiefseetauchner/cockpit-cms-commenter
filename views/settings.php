<kiss-container class="kiss-margin">

  <ul class="kiss-breadcrumbs">
    <li><a href="<?php echo $this->route('/comments')?>"><?php echo t('Comments')?></a></li>
    <li><span><?php echo t('Settings')?></span></li>
  </ul>

  <vue-view>

    <template>
      <comment-model-settings></comment-model-settings>
    </template>

    <script type="module">

      export default {
        components: {
          'comment-model-settings': 'commenter:assets/vue-components/comment-model-settings.js'
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
      <a class="kiss-link-muted kiss-flex kiss-flex-middle" href="<?php echo $this->route('/comments') ?>">
        <kiss-svg class="kiss-margin-small-right" src="<?php echo $this->base('commenter:icon.svg') ?>" width="20" height="20"><canvas width="20" height="20"></canvas></kiss-svg>
        <?php echo t('Overview') ?>
      </a>
    </li>
    <li>
      <a class="kiss-link-muted kiss-flex kiss-flex-middle kiss-text-bold" href="<?php echo $this->route('/comments/settings') ?>">
        <icon class="kiss-margin-small-right">settings</icon>
        <?php echo t('Settings') ?>
      </a>
    </li>
  </ul>
</kiss-navlist>

<?php $this->end('app-side-panel') ?>
