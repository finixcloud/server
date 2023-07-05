<!--
  - @copyright Copyright (c) 2018 John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @author John Molakvoæ <skjnldsv@protonmail.com>
  -
  - @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<Fragment>
		<NewUserModal v-if="showConfig.showNewUserForm"
			:loading="loading"
			:new-user="newUser"
			:show-config="showConfig"
			:quota-options="quotaOptions"
			@reset="resetForm"
			@close="closeModal" />

		<NcEmptyContent v-if="filteredUsers.length === 0"
			class="empty"
			:title="isInitialLoad && loading.users ? null : t('settings', 'No users')">
			<template #icon>
				<NcLoadingIcon v-if="isInitialLoad && loading.users"
					:name="t('settings', 'Loading users …')"
					:size="36" />
				<NcIconSvgWrapper v-else
					:svg="usersSvg" />
			</template>
		</NcEmptyContent>

		<RecycleScroller v-else
			class="user-list"
			ref="scroller"
			:items="filteredUsers"
			key-field="id"
			list-class="user-list__body"
			list-tag="tbody"
			role="table"
			item-class="user-list__row"
			item-tag="tr"
			:item-size="rowHeight"
			@hook:mounted="handleMounted"
			@scroll-end="handleScrollEnd">
			<template #before>
				<caption class="hidden-visually">
					{{ t('settings', 'List of users. This list is not fully rendered for performances reasons. The users will be rendered as you navigate through the list.') }}
				</caption>
				<UserListHeader :has-obfuscated="hasObfuscated" />
			</template>
			<template #default="{ item: user }">
				<UserRow :user="user"
					:users="users"
					:settings="settings"
					:show-config="showConfig"
					:has-obfuscated="hasObfuscated"
					:groups="groups"
					:sub-admins-groups="subAdminsGroups"
					:quota-options="quotaOptions"
					:languages="languages"
					:external-actions="externalActions" />
			</template>
			<template #after>
				<UserListFooter :loading="loading.users" />
			</template>
		</RecycleScroller>
	</Fragment>
</template>

<script>
import Vue from 'vue'
import { Fragment } from 'vue-frag'
import { RecycleScroller } from 'vue-virtual-scroller'

import NcEmptyContent from '@nextcloud/vue/dist/Components/NcEmptyContent.js'
import NcIconSvgWrapper from '@nextcloud/vue/dist/Components/NcIconSvgWrapper.js'
import NcLoadingIcon from '@nextcloud/vue/dist/Components/NcLoadingIcon.js'

import { subscribe, unsubscribe } from '@nextcloud/event-bus'
import { showError } from '@nextcloud/dialogs'

import NewUserModal from './Users/NewUserModal.vue'
import UserListFooter from './Users/UserListFooter.vue'
import UserListHeader from './Users/UserListHeader.vue'
import UserRow from './Users/UserRow.vue'

import { defaultQuota, isObfuscated, unlimitedQuota } from '../utils/userUtils.ts'
import logger from '../logger.js'

import usersSvg from '../../img/users.svg?raw'

const newUser = {
	id: '',
	displayName: '',
	password: '',
	mailAddress: '',
	groups: [],
	manager: '',
	subAdminsGroups: [],
	quota: defaultQuota,
	language: {
		code: 'en',
		name: t('settings', 'Default language'),
	},
}

export default {
	name: 'UserList',

	components: {
		Fragment,
		NcEmptyContent,
		NcIconSvgWrapper,
		NcLoadingIcon,
		NewUserModal,
		RecycleScroller,
		UserListFooter,
		UserListHeader,
		UserRow,
	},

	props: {
		selectedGroup: {
			type: String,
			default: null,
		},
		externalActions: {
			type: Array,
			default: () => [],
		},
	},

	data() {
		return {
			loading: {
				all: false,
				groups: false,
				users: false,
			},
			isInitialLoad: true,
			rowHeight: 55,
			usersSvg,
			searchQuery: '',
			newUser: Object.assign({}, newUser),
		}
	},

	computed: {
		showConfig() {
			return this.$store.getters.getShowConfig
		},
		settings() {
			return this.$store.getters.getServerData
		},
		hasObfuscated() {
			return this.filteredUsers.some(user => isObfuscated(user))
		},
		selectedGroupDecoded() {
			return decodeURIComponent(this.selectedGroup)
		},
		users() {
			return this.$store.getters.getUsers
		},
		filteredUsers() {
			if (this.selectedGroup === 'disabled') {
				return this.users.filter(user => user.enabled === false)
			}
			if (!this.settings.isAdmin) {
				// we don't want subadmins to edit themselves
				return this.users.filter(user => user.enabled !== false)
			}
			return this.users.filter(user => user.enabled !== false)
		},
		groups() {
			// data provided php side + remove the disabled group
			return this.$store.getters.getGroups
				.filter(group => group.id !== 'disabled')
				.sort((a, b) => a.name.localeCompare(b.name))
		},
		subAdminsGroups() {
			// data provided php side
			return this.$store.getters.getSubadminGroups
		},
		quotaOptions() {
			// convert the preset array into objects
			const quotaPreset = this.settings.quotaPreset.reduce((acc, cur) => acc.concat({
				id: cur,
				label: cur,
			}), [])
			// add default presets
			if (this.settings.allowUnlimitedQuota) {
				quotaPreset.unshift(unlimitedQuota)
			}
			quotaPreset.unshift(defaultQuota)
			return quotaPreset
		},
		usersOffset() {
			return this.$store.getters.getUsersOffset
		},
		usersLimit() {
			return this.$store.getters.getUsersLimit
		},
		usersCount() {
			return this.users.length
		},

		/* LANGUAGES */
		languages() {
			return [
				{
					label: t('settings', 'Common languages'),
					languages: this.settings.languages.commonLanguages,
				},
				{
					label: t('settings', 'Other languages'),
					languages: this.settings.languages.otherLanguages,
				},
			]
		},
	},
	watch: {
		// watch url change and group select
		async selectedGroup(val, old) {
			this.isInitialLoad = true
			// if selected is the disabled group but it's empty
			await this.redirectIfDisabled()
			this.$store.commit('resetUsers')
			await this.loadUsers()
			this.setNewUserDefaultGroup(val)
		},

		filteredUsers(filteredUsers) {
			logger.debug(`${filteredUsers.length} filtered users`)
		},
	},

	async created() {
		await this.loadUsers()
	},

	async mounted() {
		if (!this.settings.canChangePassword) {
			OC.Notification.showTemporary(t('settings', 'Password change is disabled because the master key is disabled'))
		}

		/**
		 * Reset and init new user form
		 */
		this.resetForm()

		/**
		 * Register search
		 */
		subscribe('nextcloud:unified-search.search', this.search)
		subscribe('nextcloud:unified-search.reset', this.resetSearch)

		/**
		 * If disabled group but empty, redirect
		 */
		await this.redirectIfDisabled()
	},

	beforeDestroy() {
		unsubscribe('nextcloud:unified-search.search', this.search)
		unsubscribe('nextcloud:unified-search.reset', this.resetSearch)
	},

	methods: {
		async handleMounted() {
			// Set CSS variables
			this.$refs.scroller.$el.style.setProperty('--row-height', `${this.rowHeight}px`)
			// Make the root recycle scroller a table for proper semantics
			const slots = this.$refs.scroller.$el.querySelectorAll('.vue-recycle-scroller__slot')
			slots[0].setAttribute('role', 'thead')
			slots[1].setAttribute('role', 'tfoot')
		},

		async handleScrollEnd() {
			await this.loadUsers()
		},

		async loadUsers() {
			this.loading.users = true
			try {
				await this.$store.dispatch('getUsers', {
					offset: this.usersOffset,
					limit: this.usersLimit,
					group: this.selectedGroup !== 'disabled' ? this.selectedGroup : '',
					search: this.searchQuery,
				})
				logger.debug(`${this.users.length} users loaded`)
			} catch (error) {
				logger.error('Failed to load users', { error })
				showError('Failed to load users')
			}
			this.loading.users = false
			this.isInitialLoad = false
		},

		closeModal() {
			this.$store.commit('setShowConfig', {
				key: 'showNewUserForm',
				value: false,
			})
		},

		/* SEARCH */
		async search({ query }) {
			this.searchQuery = query
			this.$store.commit('resetUsers')
			await this.loadUsers()
		},

		resetSearch() {
			this.search({ query: '' })
		},

		resetForm() {
			// revert form to original state
			this.newUser = Object.assign({}, newUser)

			/**
			 * Init default language from server data. The use of this.settings
			 * requires a computed variable, which break the v-model binding of the form,
			 * this is a much easier solution than getter and setter on a computed var
			 */
			if (this.settings.defaultLanguage) {
				Vue.set(this.newUser.language, 'code', this.settings.defaultLanguage)
			}

			/**
			 * In case the user directly loaded the user list within a group
			 * the watch won't be triggered. We need to initialize it.
			 */
			this.setNewUserDefaultGroup(this.selectedGroup)

			this.loading.all = false
		},

		setNewUserDefaultGroup(value) {
			if (value && value.length > 0) {
				// setting new user default group to the current selected one
				const currentGroup = this.groups.find(group => group.id === value)
				if (currentGroup) {
					this.newUser.groups = [currentGroup]
					return
				}
			}
			// fallback, empty selected group
			this.newUser.groups = []
		},

		/**
		 * If the selected group is the disabled group but the count is 0
		 * redirect to the all users page.
		 * we only check for 0 because we don't have the count on ldap
		 * and we therefore set the usercount to -1 in this specific case
		 */
		async redirectIfDisabled() {
			const allGroups = this.$store.getters.getGroups
			if (this.selectedGroup === 'disabled'
						&& allGroups.findIndex(group => group.id === 'disabled' && group.usercount === 0) > -1) {
				// disabled group is empty, redirection to all users
				this.$router.push({ name: 'users' })
				await this.loadUsers()
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.empty {
	:deep {
		.icon-vue {
			width: 64px;
			height: 64px;

			svg {
				max-width: 64px;
				max-height: 64px;
			}
		}
	}
}

.user-list {
	--avatar-cell-width: 48px;
	--cell-padding: 7px;
	--cell-width: 200px;
	--cell-min-width: calc(var(--cell-width) - (2 * var(--cell-padding)));

	display: block;
	overflow: auto;
	height: 100%;

	:deep {
		.user-list {
			&__body {
				display: flex;
				flex-direction: column;
				width: 100%;
				// Necessary for virtual scrolling absolute
				position: relative;
				margin-top: var(--row-height);
			}

			&__row {
				position: absolute;
				display: flex;
				height: var(--row-height);
				background-color: var(--color-main-background);
				border-bottom: 1px solid var(--color-border);

				&:hover {
					background-color: var(--color-background-hover);

					.row__cell:not(.row__cell--actions) {
						background-color: var(--color-background-hover);
					}
				}
			}
		}

		.vue-recycle-scroller__slot {
			&[role='thead'] {
				position: sticky;
			}

			&[role='thead'] {
				top: 0;
				z-index: 10;
			}
		}
	}
}
</style>
