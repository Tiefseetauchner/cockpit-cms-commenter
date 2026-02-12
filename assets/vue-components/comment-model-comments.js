export default {

    data() {
        return {
            models: [],
            commentModels: [],
            selectedParentModel: '',
            comments: [],
            selectedCommentIds: [],
            bulkProcessing: false,
            pressTimer: null,
            pressTargetId: null,
            justLongPressedId: null,
            loading: false,
            loadingModels: true,
            filter: '',
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

        availableParentModels() {
            return (this.models || []).filter(model => {
                return !!this.commentModelByParent[model.name];
            });
        },

        selectedCommentModel() {
            return this.commentModelByParent[this.selectedParentModel] || null;
        },

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

    watch: {
        selectedParentModel() {
            this.loadComments();
        }
    },

    mounted() {
        this.loadModels();
    },

    methods: {

        async loadModels() {
            this.loadingModels = true;
            this.error = null;

            try {
                const models = await App.utils.getContentModels();
                this.models = Object.values(models || {}).filter(model => {
                    return !((model.meta || {}).commenter);
                });

                this.commentModels = await this.$request('/comments/models');

                if (!this.selectedParentModel) {
                    const first = this.availableParentModels[0];
                    this.selectedParentModel = first ? first.name : '';
                }

                if (!this.selectedCommentModel) {
                    this.comments = [];
                }
            } catch (err) {
                this.error = err?.error || 'Loading models failed!';
            } finally {
                this.loadingModels = false;
            }
        },

        async loadComments() {
            this.loading = true;
            this.error = null;

            if (!this.selectedCommentModel) {
                this.comments = [];
                this.loading = false;
                return;
            }

            try {
                const rsp = await this.$request(`/content/collection/find/${this.selectedCommentModel.name}`, {
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
            this.$request(`/content/models/saveItem/${this.selectedCommentModel.name}/`, {
                item: {
                    _id: comment._id,
                    reviewed: !comment.reviewed
                }
            }).then(res => {
                comment.reviewed = !comment.reviewed;
                App.ui.notify(comment.reviewed ? 'Comment published!' : 'Comment unpublished!');
            }).catch(rsp => {
                App.ui.notify(rsp.error || 'Changing publishing state failed!', 'error');
            });

        },

        async setPublished(comment, published) {
            return this.$request(`/content/models/saveItem/${this.selectedCommentModel.name}/`, {
                item: {
                    _id: comment._id,
                    reviewed: !!published
                }
            });
        },

        stateChangeText(comment) {
            return comment && comment.reviewed ? this.t('Unpublish') : this.t('Publish');
        },

        goToComment(comment) {
            if (!comment || !comment._id || !this.selectedCommentModel) return;
            if (this.justLongPressedId === comment._id) {
                this.justLongPressedId = null;
                return;
            }
            const modelName = this.selectedCommentModel.name || this.selectedCommentModel;
            window.location.href = this.$routeUrl(`/content/collection/item/${modelName}/${comment._id}`);
        },

        toggleSelection(comment) {
            if (!comment || !comment._id) return;
            const next = [...this.selectedCommentIds];
            const idx = next.indexOf(comment._id);
            if (idx !== -1) {
                next.splice(idx, 1);
            } else {
                next.push(comment._id);
            }
            this.selectedCommentIds = next;
        },

        toggleAllSelection() {
            const visibleIds = this.filteredComments.map(c => c._id);
            const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => this.selectedCommentIds.indexOf(id) !== -1);

            if (allVisibleSelected) {
                const visibleMap = Object.fromEntries(visibleIds.map(id => [id, true]));
                this.selectedCommentIds = this.selectedCommentIds.filter(id => !visibleMap[id]);
                return;
            }

            if (!visibleIds.length) {
                this.selectedCommentIds = [];
                return;
            }

            const next = [...this.selectedCommentIds];
            visibleIds.forEach(id => {
                if (next.indexOf(id) === -1) next.push(id);
            });
            this.selectedCommentIds = next;
        },

        async publishAll(published) {
            if (!this.selectedCommentModel || !this.selectedCommentIds.length || this.bulkProcessing) return;

            const selectedMap = Object.fromEntries(this.selectedCommentIds.map(id => [id, true]));
            const selectedComments = this.comments.filter(comment => selectedMap[comment._id]);
            if (!selectedComments.length) return;

            this.bulkProcessing = true;
            this.error = null;

            try {
                await Promise.all(selectedComments.map(comment => this.setPublished(comment, published)));
                this.comments = this.comments.map(comment => 
                    selectedMap[comment._id]
                        ? { ...comment, reviewed: !!published }
                        : comment);
                App.ui.notify(published ? 'Selected comments published!' : 'Selected comments unpublished!');
            } catch (err) {
                App.ui.notify(err?.error || 'Bulk publish state change failed!', 'error');
            } finally {
                this.bulkProcessing = false;
            }
        },

        async deleteSelected() {
            if (!this.selectedCommentModel || !this.selectedCommentIds.length || this.bulkProcessing) return;

            if (!window.confirm(this.t('Delete selected comments? This cannot be undone.'))) {
                return;
            }

            const ids = [...this.selectedCommentIds];
            this.bulkProcessing = true;
            this.error = null;

            try {
                await this.$request(`/content/collection/remove/${this.selectedCommentModel.name}/`, {
                    ids: ids
                });

                const removed = Object.fromEntries(ids.map(id => [id, true]));
                this.comments = this.comments.filter(comment => !removed[comment._id]);
                this.selectedCommentIds = [];
                App.ui.notify('Selected comments deleted!');
            } catch (err) {
                App.ui.notify(err?.error || 'Deleting selected comments failed!', 'error');
            } finally {
                this.bulkProcessing = false;
            }
        },

        onRowPressStart(comment) {
            this.onRowPressEnd();
            if (!comment || !comment._id) return;
            this.pressTargetId = comment._id;
            this.pressTimer = setTimeout(() => {
                if (this.pressTargetId === comment._id) {
                    this.toggleSelection(comment);
                    this.justLongPressedId = comment._id;
                }
            }, 500);
        },

        onRowPressEnd() {
            if (this.pressTimer) {
                clearTimeout(this.pressTimer);
                this.pressTimer = null;
            }
            this.pressTargetId = null;
        }
    },

    template: /*html*/`
        <div>

            <div class="kiss-flex kiss-flex-middle kiss-margin">
                <div class="kiss-flex-1">
                    <div class="kiss-text-caption kiss-text-bold kiss-color-muted kiss-size-small">
                        {{ t('Comments') }}
                    </div>
                    <div class="kiss-size-xsmall kiss-color-muted" v-if="selectedCommentModel">
                        {{ t('Model') }}: {{ selectedCommentModel.parentLabel || selectedParentModel }}
                    </div>
                </div>
                <div class="kiss-flex" gap>
                    <select class="kiss-input kiss-select" v-model="selectedParentModel" :disabled="!availableParentModels.length">
                        <option disabled value="">{{ t('Select model') }}</option>
                        <option v-for="model in availableParentModels" :key="model.name" :value="model.name">
                            {{ model.label || model.name }}
                        </option>
                    </select>
                    <input type="text" class="kiss-input" :placeholder="t('Search comments...')" v-model="filter">
                </div>
            </div>

            <app-loader class="kiss-margin-large" v-if="loadingModels || loading"></app-loader>

            <div class="kiss-margin" v-if="!loadingModels && !loading && error">
                <app-alert type="error">{{ error }}</app-alert>
            </div>

            <div class="animated fadeIn kiss-height-50vh kiss-flex kiss-flex-middle kiss-flex-center kiss-align-center kiss-color-muted kiss-margin-large" v-if="!loadingModels && !loading && !error && !availableParentModels.length">
                <div>
                    <icon>chat_bubble_outline</icon>
                    <p class="kiss-size-large kiss-margin-top">{{ t('No comment models yet') }}</p>
                    <p class="kiss-size-small kiss-color-muted">{{ t('Create a comment model to start moderating comments.') }}</p>
                    <a class="kiss-button kiss-button-primary kiss-margin-top" :href="$routeUrl('/comments/settings')">
                        {{ t('Go to settings') }}
                    </a>
                </div>
            </div>

            <div class="animated fadeIn kiss-height-50vh kiss-flex kiss-flex-middle kiss-flex-center kiss-align-center kiss-color-muted kiss-margin-large" v-if="!loadingModels && !loading && !error && availableParentModels.length && !filteredComments.length">
                <div>
                    <icon>chat_bubble_outline</icon>
                    <p class="kiss-size-large kiss-margin-top">{{ t('No comments') }}</p>
                </div>
            </div>

            <div class="kiss-margin" v-if="!loadingModels && !loading && filteredComments.length">

                <div class="kiss-flex kiss-margin-small-bottom" gap>
                    <button class="kiss-button" type="button" @click="publishAll(true)" :disabled="bulkProcessing || !selectedCommentIds.length">
                        {{ t('Publish all') }}
                    </button>
                    <button class="kiss-button" type="button" @click="publishAll(false)" :disabled="bulkProcessing || !selectedCommentIds.length">
                        {{ t('Unpublish all') }}
                    </button>
                    <button class="kiss-button kiss-button-danger" type="button" @click="deleteSelected()" :disabled="bulkProcessing || !selectedCommentIds.length">
                        {{ t('Delete') }}
                    </button>
                </div>

                <table class="kiss-table animated fadeIn" style="table-layout:auto; width:100%;">
                    <thead>
                        <tr>

                            <th style="width:1%;">
                                <input type="checkbox" class="kiss-checkbox"
                                    :checked="filteredComments.length > 0 && filteredComments.every(comment => selectedCommentIds.indexOf(comment._id) !== -1)"
                                    @click.stop
                                    @change="toggleAllSelection()">
                            </th>
                            <th style="width:100%;">{{ t('Comment') }}</th>
                            <th style="white-space:nowrap;">{{ t('Post date') }}</th>
                            <th class="kiss-align-right" style="white-space:nowrap;">{{ t('State') }}</th>
                            <th class="kiss-align-right" style="white-space:nowrap;">{{ t('Action') }}</th>
                            
                        </tr>
                    </thead>
                    <tbody>
            
                        <tr class="kiss-margin-small" theme="shadowed contrast" v-for="comment in filteredComments" :key="comment._id"
                            @click="goToComment(comment)"
                            @touchstart="onRowPressStart(comment)"
                            @touchend="onRowPressEnd()"
                            @touchcancel="onRowPressEnd()"
                            @mousedown="onRowPressStart(comment)"
                            @mouseup="onRowPressEnd()"
                            @mouseleave="onRowPressEnd()">
                            <td style="width:1%;">
                                <input type="checkbox" class="kiss-checkbox"
                                    :checked="selectedCommentIds.indexOf(comment._id) !== -1"
                                    @click.stop
                                    @change="toggleSelection(comment)">
                            </td>
                            <td>
                                <div class="kiss-text-bold">{{ comment.username || t('Anonymous') }}</div>
                                <span class="kiss-color-muted kiss-size-xsmall" v-if="comment.email">({{ comment.email }})</span>
                                <div v-if="comment.message" class="kiss-text-wrap">{{ comment.message }}</div>
                                <div v-else class="kiss-color-muted">{{ t('No message') }}</div>
                            </td>
                            <td class="kiss-margin-xsmall-top kiss-size-xsmall kiss-color-muted" style="white-space:nowrap;">
                                {{ formatDate(comment.created || comment._created) }}
                            </td>
                            <td class="kiss-align-right" style="white-space:nowrap;">
                                <div class="kiss-badge" :class="comment.reviewed ? 'kiss-bgcolor-success' : 'kiss-bgcolor-warning'">
                                    {{ stateText(comment) }}
                                </div>
                            </td>
                            <td class="kiss-align-right" style="white-space:nowrap;">
                                <a class="kiss-button kiss-button-small" @click.stop="publishUnpublish(comment)">
                                    {{ stateChangeText(comment) }}
                                </a>
                            </td>
                        </tr>

                    </tbody>
                </table>

            </div>

        </div>
    `
};
