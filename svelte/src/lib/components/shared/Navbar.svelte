<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { Home, BookOpen, BookMarked, Info, Settings } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';

	interface NavItem {
		href: string;
		label: string;
		icon: ComponentType;
	}

	const navItems: NavItem[] = [
		{ href: '/', label: 'Koti', icon: Home },
		{ href: '/sanasto', label: 'Sanasto', icon: BookMarked },
		{ href: '/kielten-oppiminen', label: 'Kielten oppiminen', icon: BookOpen },
		{ href: '/tietoja', label: 'Tietoja', icon: Info },
		{ href: '/asetukset', label: 'Asetukset', icon: Settings }
	];

	const gameModePaths = [
		'/sanapeli',
		'/yhdistasanat',
		'/tarinat',
		'/muisti',
		'/kuuntelu',
		'/lukeminen',
		'/puhuminen',
		'/pipsan-ystavat',
		'/pipsan-maailma'
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

	function isInGameMode(): boolean {
		const currentPath = $page.url.pathname;
		return gameModePaths.some(path => currentPath.includes(path));
	}
</script>

<!-- 
	Main navbar: visible on desktop always, hidden on mobile in game modes.
	Game modes have their own back buttons via GameContainer.
-->
<nav class="navbar bg-base-100 shadow-sm" class:hidden={isInGameMode()} class:lg:flex={isInGameMode()}>
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
						{@const Icon = item.icon}
						<li>
							<a
								href="{base}{item.href}"
								class={isActive(item.href) ? 'active' : ''}
								onclick={closeMenu}
							>
								<Icon size={20} class="opacity-50 mr-1 md:-mr-1" />
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
		<ul class="menu menu-horizontal px-1 gap-4">
			{#each navItems as item}
				{@const Icon = item.icon}
				<li>
					<a
						href="{base}{item.href}"
						class={isActive(item.href) ? 'active' : ''}
					>
						<Icon size={20} class="opacity-50 -mr-1" />
						{item.label}
					</a>
				</li>
			{/each}
		</ul>
	</div>
</nav>
