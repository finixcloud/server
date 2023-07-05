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
	<tr class="footer">
		<td v-if="loading">
			<NcLoadingIcon :name="t('settings', 'Loading users …')"
				:size="36" />
		</td>
	</tr>
</template>

<script lang="ts">
import Vue from 'vue'
import NcLoadingIcon from '@nextcloud/vue/dist/Components/NcLoadingIcon.js'

import { translate as t } from '@nextcloud/l10n'

export default Vue.extend({
	name: 'UserListFooter',

	components: {
		NcLoadingIcon,
	},

	props: {
		loading: {
			type: Boolean,
			required: true,
		},
	},

	methods: {
		t,
	},
})
</script>

<style lang="scss" scoped>
.footer {
	// FIXME center on horizontal scroll
	display: flex;
	justify-content: center;
	margin: 20px 0;
}
</style>
