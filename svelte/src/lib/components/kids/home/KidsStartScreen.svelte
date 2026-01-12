<script lang="ts">
	export let title: string;
	export let subtitle: string;
	export let subtitleSpanish: string;
	export let previewImages: string[];
	export let autoPlayAudio: boolean;
	export let onToggleAudio: (enabled: boolean) => void;
	export let onStart: () => void;
	export let onOpenSanakirja: () => void;
</script>

<div class="card bg-white/95 shadow-2xl backdrop-blur min-h-[calc(100vh-5rem)] sm:min-h-0 flex flex-col">
	<div class="card-body px-2 py-2 sm:px-4 sm:py-4 md:px-6 md:py-6 flex-1 flex flex-col justify-between">
		<div>
			<div class="text-center mb-2">
				<div class="text-4xl sm:text-5xl mb-1">🐷👫🇪🇸</div>
				<h1 class="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent leading-tight">
					{title}
				</h1>
				<p class="text-base sm:text-lg text-base-content/70 mt-0.5 leading-tight">
					{subtitle}
				</p>
				<p class="text-xs sm:text-sm text-base-content/50 mt-0.5 leading-tight">
					{subtitleSpanish}
				</p>
			</div>

			<!-- Preview: Toggle between modes -->
			<div class="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-2 sm:p-3 mb-2">
				<div class="grid grid-cols-2 gap-2 sm:gap-4">
					<div>
						<p class="text-xs font-bold text-center mb-2">🖼️ Kuvavinkki</p>
						<div class="grid grid-cols-2 gap-1 sm:gap-2">
							<div class="aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-pink-300">
								<img src={previewImages[0]} alt="Preview 1" class="w-full h-full object-cover" />
							</div>
							<div class="aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-blue-300">
								<img src={previewImages[1]} alt="Preview 2" class="w-full h-full object-cover" />
							</div>
						</div>
					</div>
					<div>
						<p class="text-xs font-bold text-center mb-2">😀 Emoji-vinkki</p>
						<div class="grid grid-cols-2 gap-2">
							<div class="aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
								<span class="text-3xl sm:text-xl">🐷💦🟤👢😄</span>
							</div>
							<div class="aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
								<span class="text-3xl sm:text-xl">🐷👆💗✨</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Audio Toggle -->
			<div class="form-control mb-2">
				<label class="label cursor-pointer bg-base-200 rounded-lg p-1.5 sm:p-2 w-full">
					<div class="flex items-center gap-2">
						<span class="text-2xl sm:text-3xl">🔊</span>
						<span class="text-base sm:text-lg font-bold">Ääni päälle</span>
					</div>
					<input
						type="checkbox"
						checked={autoPlayAudio}
						onchange={(e) => onToggleAudio((e.target as HTMLInputElement).checked)}
						class="toggle toggle-secondary toggle-sm sm:toggle-md ml-auto"
					/>
				</label>
			</div>
		</div>

		<!-- Action Buttons Row -->
		<div class="flex gap-2 sm:gap-3 items-stretch">
			<button 
				class="btn btn-sm sm:btn-md md:btn-lg flex-shrink-0 bg-pink-200 hover:bg-pink-300 border-pink-300 text-base-content text-xs sm:text-sm md:text-base"
				onclick={onOpenSanakirja}
			>
				<span class="text-lg sm:text-xl md:text-2xl hidden sm:inline">📖</span>
				Sanakirja
			</button>

			<button 
				class="btn btn-primary btn-sm sm:btn-md md:btn-lg flex-1 text-sm sm:text-base md:text-xl"
				onclick={onStart}
			>
				<span class="text-xl sm:text-2xl md:text-3xl hidden sm:inline">🎮</span>
				Aloita
			</button>
		</div>
	</div>
</div>
