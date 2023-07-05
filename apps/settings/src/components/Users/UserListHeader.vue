<!--
	- @copyright 2023 Christopher Ng <chrng8@gmail.com>
	-
	- @author Christopher Ng <chrng8@gmail.com>
	-
	- @license AGPL-3.0-or-later
	-
	- This program is free software: you can redistribute it and/or modify
	- it under the terms of the GNU Affero General Public License as
	- published by the Free Software Foundation, either version 3 of the
	- License, or (at your option) any later version.
	-
	- This program is distributed in the hope that it will be useful,
	- but WITHOUT ANY WARRANTY; without even the implied warranty of
	- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	- GNU Affero General Public License for more details.
	-
	- You should have received a copy of the GNU Affero General Public License
	- along with this program. If not, see <http://www.gnu.org/licenses/>.
	-
-->

<template>
	<tr class="header">
		<th class="row__cell row__cell--avatar">
			<span class="hidden-visually">
				{{ t('settings', 'Avatar') }}
			</span>
		</th>
		<th class="row__cell row__cell--displayname">
			<strong>
				{{ t('settings', 'Display name') }}
			</strong>
			<span class="row__subtitle">
				{{ t('settings', 'Username') }}
			</span>
		</th>
		<th class="row__cell"
			:class="{ 'row__cell--obfuscated': hasObfuscated }">
			<span>{{ passwordLabel }}</span>
		</th>
		<th class="row__cell">
			<span>{{ t('settings', 'Email') }}</span>
		</th>
		<th class="row__cell row__cell--large">
			<span>{{ t('settings', 'Groups') }}</span>
		</th>
		<th v-if="subAdminsGroups.length>0 && settings.isAdmin"
			class="row__cell row__cell--large">
			<span>{{ t('settings', 'Group admin for') }}</span>
		</th>
		<th class="row__cell">
			<span>{{ t('settings', 'Quota') }}</span>
		</th>
		<th v-if="showConfig.showLanguages"
			class="row__cell row__cell--large">
			<span>{{ t('settings', 'Language') }}</span>
		</th>
		<th v-if="showConfig.showUserBackend || showConfig.showStoragePath"
			class="row__cell row__cell--large">
			<span v-if="showConfig.showUserBackend">
				{{ t('settings', 'User backend') }}
			</span>
			<span v-if="showConfig.showStoragePath"
				class="row__subtitle">
				{{ t('settings', 'Storage location') }}
			</span>
		</th>
		<th v-if="showConfig.showLastLogin"
			class="row__cell">
			<span>{{ t('settings', 'Last login') }}</span>
		</th>
		<th class="row__cell row__cell--large">
			<span>{{ t('settings', 'Manager') }}</span>
		</th>
		<th class="row__cell row__cell--actions">
			<span class="hidden-visually">
				{{ t('settings', 'User actions') }}
			</span>
		</th>
	</tr>
</template>

<script lang="ts">
import Vue from 'vue'

import { translate as t } from '@nextcloud/l10n'

export default Vue.extend({
	name: 'UserListHeader',

	props: {
		hasObfuscated: {
			type: Boolean,
			required: true,
		},
	},

	computed: {
		showConfig() {
			// @ts-expect-error
			return this.$store.getters.getShowConfig
		},

		settings() {
			// @ts-expect-error
			return this.$store.getters.getServerData
		},

		subAdminsGroups() {
			// @ts-expect-error
			return this.$store.getters.getSubadminGroups
		},

		passwordLabel(): string {
			if (this.hasObfuscated) {
				return t('settings', 'Password or insufficient permissions message')
			}
			return t('settings', 'Password')
		},
	},

	methods: {
		t,
	},
})
</script>

<style lang="scss" scoped>
@import './shared/styles.scss';

.header {
	position: absolute;
	display: flex;
	height: var(--row-height);
	background-color: var(--color-main-background);
	border-bottom: 1px solid var(--color-border);

	@include row;
}
</style>
