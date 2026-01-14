<script lang="ts">
	import { base } from '$app/paths';
	import { dataSources, softwareLicenses, appInfo } from '$lib/data/licenses';
</script>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto max-w-2xl px-4 py-8">
		<div class="mb-4">
			<a href="{base}/" class="btn btn-ghost btn-sm">← Takaisin valikkoon</a>
		</div>

		<h1 class="mb-6 text-4xl font-bold">ℹ️ Tietoja</h1>

		<!-- App Info Card -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">📱 {appInfo.name}</h2>
				<p class="text-base-content/70">{appInfo.description}</p>

				<div class="divider"></div>

				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span>Versio:</span>
						<span class="font-bold">{appInfo.version}</span>
					</div>
					<div class="flex justify-between">
						<span>Tietojen tallennus:</span>
						<span class="font-bold">{appInfo.storage}</span>
					</div>
					<div class="flex justify-between">
						<span>Yksityisyys:</span>
						<span class="font-bold">{appInfo.privacy}</span>
					</div>
					<div class="flex justify-between">
						<span>Offline-tuki:</span>
						<span class="font-bold">{appInfo.offline}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Data Sources Card -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">📊 Tietolähteet</h2>
				<p class="text-sm text-base-content/70">
					Tämä sovellus käyttää avoimen lähdekoodin tietolähteitä
				</p>

				<div class="divider"></div>

				{#each dataSources as source}
					<div class="mb-4 rounded-lg bg-base-200 p-4">
						<h3 class="font-bold">{source.name}</h3>
						<p class="text-sm text-base-content/70">{source.description}</p>

						<div class="mt-2 space-y-1 text-sm">
							<div>
								<span class="text-base-content/60">Lähde:</span>
								<a
									href={source.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="link link-primary"
								>
									{source.source}
								</a>
							</div>
							<div>
								<span class="text-base-content/60">Lisenssi:</span>
								<a
									href={source.licenseUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="link link-primary"
								>
									{source.license}
								</a>
							</div>
							<div class="mt-2 rounded bg-base-300 p-2 text-xs italic">
								"{source.attribution}"
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Software Licenses Card -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">⚙️ Ohjelmistolisenssit</h2>
				<p class="text-sm text-base-content/70">
					Sovellus on rakennettu näillä avoimen lähdekoodin työkaluilla
				</p>

				<div class="divider"></div>

				<div class="overflow-x-auto">
					<table class="table table-sm">
						<thead>
							<tr>
								<th>Ohjelmisto</th>
								<th>Lisenssi</th>
							</tr>
						</thead>
						<tbody>
							{#each softwareLicenses as software}
								<tr>
									<td>
										<a
											href={software.url}
											target="_blank"
											rel="noopener noreferrer"
											class="link link-primary"
										>
											{software.name}
										</a>
									</td>
									<td>
										<span class="badge badge-ghost badge-sm">{software.license}</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Open Source Notice -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">🌐 Avoin lähdekoodi</h2>
				<p class="text-sm text-base-content/70">
					Espanjapeli on avoimen lähdekoodin projekti. Kaikki lähdekoodi on vapaasti saatavilla.
				</p>

				<div class="divider"></div>

				<div class="text-center">
					<p class="mb-4 text-sm">Mobiiliystävällinen oppimissovellus</p>
					<p class="text-xs text-base-content/50">Ei tiliä tarvita · Ilmainen · Avoimen lähdekoodin</p>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-8 text-center text-sm text-base-content/50">
			<p>© 2024-2026 Espanjapeli</p>
		</div>
	</div>
</div>
