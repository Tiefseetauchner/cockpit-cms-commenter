export default {

    props: {
        model: {
            type: String,
            required: true
        }
    },

    data() {
        return {
            comments: [],
            loading: true,
            filter: '',
            error: null
        };
    },

    computed: {
        filteredComments() {

            if (!this.filter) return this.comments;

            const term = this.filter.toLocaleLowerCase();

            return this.comments.filter(comment => {
                const haystack = [
                    comment.username,
                    comment.email,
                    comment.message
                ].filter(Boolean).join(' ').toLocaleLowerCase();

                return haystack.includes(term);
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
                const rsp = await this.$request(`/content/collection/find/${this.model}`, {
                    options: {
                        sort: {created: -1}
                    }
                });

                this.comments = rsp.items || [];
            } catch (err) {
                this.error = err?.error || 'Loading comments failed!';
            } finally {
                this.loading = false;
            }
        },

        formatDate(timestamp) {
            if (!timestamp) return 'n/a';
            return new Date(timestamp * 1000).toLocaleString();
        },

        stateText(comment) {
            return comment && comment.reviewed ? this.t('Published') : this.t('Unpublished');
        },

        publishUnpublish(comment) {
            this.$request(`/content/models/saveItem/${this.model}/`, {
                item: {
                    _id: comment._id,
                    reviewed: !comment.reviewed
                }
            }).then(res => {
                comment.reviewed = !comment.reviewed
                App.ui.notify(comment.reviewed ? 'Comment published!' : 'Comment unpublished!')
            }).catch(rsp => {
                App.ui.notify(rsp.error || 'Changing publishing state failed!', 'error')
            })

        },

        stateChangeText(comment) {
            return comment && comment.reviewed ? this.t('Unpublish') : this.t('Publish');
        }
    },

    template: /*html*/`
        <div>

            <div class="kiss-flex kiss-flex-middle kiss-margin">
                <div class="kiss-flex-1">
                    <div class="kiss-text-caption kiss-text-bold kiss-color-muted kiss-size-small">
                        {{ t('Comments') }}
                    </div>
                    <div class="kiss-size-xsmall kiss-color-muted">{{ t('Model') }}: {{ model }}</div>
                </div>
                <div>
                    <input type="text" class="kiss-input" :placeholder="t('Search comments...')" v-model="filter">
                </div>
            </div>

            <app-loader class="kiss-margin-large" v-if="loading"></app-loader>

            <div class="kiss-margin" v-if="!loading && error">
                <app-alert type="error">{{ error }}</app-alert>
            </div>

            <div class="animated fadeIn kiss-height-50vh kiss-flex kiss-flex-middle kiss-flex-center kiss-align-center kiss-color-muted kiss-margin-large" v-if="!loading && !error && !filteredComments.length">
                <div>
                    <icon>chat_bubble_outline</icon>
                    <p class="kiss-size-large kiss-margin-top">{{ t('No comments') }}</p>
                </div>
            </div>

            <div class="kiss-margin" v-if="!loading && filteredComments.length">

                <kiss-card class="kiss-margin-small animated fadeIn" theme="shadowed contrast" v-for="comment in filteredComments" :key="comment._id">
                    <div class="kiss-padding-small">
                        <div class="kiss-flex kiss-flex-middle" gap>
                            <div class="kiss-text-bold kiss-flex-1">
                                {{ comment.username || t('Anonymous') }}
                                <span class="kiss-color-muted kiss-size-xsmall" v-if="comment.email">({{ comment.email }})</span>
                            </div>
                            <div class="kiss-flex kiss-flex-end">
                                <div class="kiss-badge" :class="comment.reviewed ? 'kiss-bgcolor-success' : 'kiss-bgcolor-warning'">
                                    {{ stateText(comment) }}
                                </div>
                                <a class="kiss-button kiss-button-small" @click="publishUnpublish(comment)">
                                    {{ stateChangeText(comment) }}
                                </a>
                            </div>
                        </div>
                        <div class="kiss-margin-xsmall-top kiss-size-xsmall kiss-color-muted">
                            {{ formatDate(comment.created || comment._created) }}
                        </div>
                        <div class="kiss-margin-small-top">
                            <div v-if="comment.message" class="kiss-text-wrap">{{ comment.message }}</div>
                            <div v-else class="kiss-color-muted">{{ t('No message') }}</div>
                        </div>
                    </div>
                </kiss-card>

            </div>

        </div>
    `
};
