<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	interface NavItem {
		href: string;
		label: string;
		icon: string;
	}

	const navItems: NavItem[] = [
		{ href: '/', label: 'Koti', icon: '🏠' },
		{ href: '/tietoja', label: 'Tietoja', icon: 'ℹ️' },
		{ href: '/asetukset', label: 'Asetukset', icon: '⚙️' }
	];

	let isMenuOpen = $state(false);

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	function isActive(href: string): boolean {
		const currentPath = $page.url.pathname;
		if (href === '/') {
			return currentPath === base || currentPath === `${base}/`;
		}
		return currentPath.startsWith(`${base}${href}`);
	}
</script>

<nav class="navbar bg-base-100 shadow-sm">
	<div class="navbar-start">
		<!-- Mobile hamburger menu -->
		<div class="dropdown">
			<button
				class="btn btn-ghost lg:hidden"
				onclick={toggleMenu}
				aria-label="Avaa valikko"
				aria-expanded={isMenuOpen}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h8m-8 6h16"
					/>
				</svg>
			</button>
			{#if isMenuOpen}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div class="fixed inset-0 z-40" onclick={closeMenu}></div>
				<ul
					class="menu dropdown-content menu-sm z-50 mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
				>
					{#each navItems as item}
						<li>
							<a
								href="{base}{item.href}"
								class={isActive(item.href) ? 'active' : ''}
								onclick={closeMenu}
							>
								<span>{item.icon}</span>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<!-- Logo/Brand -->
		<a href="{base}/" class="btn btn-ghost text-xl">🇪🇸 Espanjapeli</a>
	</div>

	<!-- Desktop menu -->
	<div class="navbar-end hidden lg:flex">
		<ul class="menu menu-horizontal px-1">
			{#each navItems as item}
				<li>
					<a
						href="{base}{item.href}"
						class={isActive(item.href) ? 'active' : ''}
					>
						<span>{item.icon}</span>
						{item.label}
					</a>
				</li>
			{/each}
		</ul>
	</div>
</nav>
