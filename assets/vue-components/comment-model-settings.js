export default {

    data() {
        return {
            models: [],
            commentModels: [],
            loading: true,
            error: null
        };
    },

    computed: {
        commentModelByParent() {
            const map = {};
            (this.commentModels || []).forEach(model => {
                map[model.parentModel] = model;
            });
            return map;
        },

        parentModels() {
            return (this.models || []).filter(model => {
                return !((model.meta || {}).commenter);
            });
        }
    },

    mounted() {
        this.load();
    },

    methods: {

        async load() {
            this.loading = true;
            this.error = null;

            try {
                const models = await App.utils.getContentModels();
                this.models = Object.values(models || {});
                this.commentModels = await this.$request('/comments/models');
            } catch (err) {
                this.error = err?.error || 'Loading models failed!';
            } finally {
                this.loading = false;
            }
        },

        createCommentModel(model) {
            this.$request('/comments/create', {model: model.name}).then(() => {
                App.ui.notify('Comment model created!');
                this.load();
            }).catch(rsp => {
                App.ui.notify(rsp.error || 'Failed to create comment model', 'error');
            });
        }
    },

    template: /*html*/`
        <div>

            <app-loader class="kiss-margin-large" v-if="loading"></app-loader>

            <div class="kiss-margin" v-if="!loading && error">
                <app-alert type="error">{{ error }}</app-alert>
            </div>

            <div class="animated fadeIn kiss-height-50vh kiss-flex kiss-flex-middle kiss-flex-center kiss-align-center kiss-color-muted kiss-margin-large" v-if="!loading && !error && !parentModels.length">
                <div>
                    <icon>layers</icon>
                    <p class="kiss-size-large kiss-margin-top">{{ t('No content models found') }}</p>
                </div>
            </div>

            <div class="kiss-margin" v-if="!loading && !error && parentModels.length">

                <table class="kiss-table animated fadeIn">
                    <thead>
                        <tr>
                            <th>{{ t('Content model') }}</th>
                            <th>{{ t('Type') }}</th>
                            <th>{{ t('Comment model') }}</th>
                            <th class="kiss-align-right">{{ t('Action') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="model in parentModels" :key="model.name">
                            <td>
                                <div class="kiss-text-bold">{{ model.label || model.name }}</div>
                                <div class="kiss-size-xsmall kiss-color-muted">{{ model.name }}</div>
                            </td>
                            <td class="kiss-size-small kiss-color-muted">{{ model.type }}</td>
                            <td>
                                <span v-if="commentModelByParent[model.name]">
                                    {{ commentModelByParent[model.name].label || commentModelByParent[model.name].name }}
                                </span>
                                <span v-else class="kiss-color-muted">{{ t('Not created') }}</span>
                            </td>
                            <td class="kiss-align-right">
                                <button class="kiss-button kiss-button-small" v-if="!commentModelByParent[model.name]" @click="createCommentModel(model)">
                                    {{ t('Create') }}
                                </button>
                                <a class="kiss-button kiss-button-small" v-else :href="$routeUrl('/comments')">
                                    {{ t('Open') }}
                                </a>
                            </td>
                        </tr>
                    </tbody>
                </table>

            </div>

        </div>
    `
};
