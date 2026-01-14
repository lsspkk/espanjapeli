<script lang="ts">
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Kielten oppiminen - Tutkitut strategiat</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto max-w-5xl px-4 py-8">
		<!-- Back Link -->
		<div class="mb-4">
			<a href="{base}/" class="btn btn-ghost btn-sm">
				← Takaisin peliin
			</a>
		</div>

		<!-- Header -->
		<div class="mb-8 rounded-lg border-b-4 border-primary bg-base-100 p-6 text-center shadow-lg">
			<h1 class="mb-2 text-4xl font-bold text-primary">🌍 Kielten oppiminen</h1>
			<p class="text-base-content/70">Tutkitut strategiat tehokkaaseen kielten oppimiseen</p>
		</div>

		<!-- Warning Box -->
		<div class="alert alert-warning mb-8 shadow-lg">
			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<div>
					<h3 class="font-bold">Huomautus</h3>
					<div class="text-sm">
						Kaikki tämä teksti on Claude-tekoälyagentin koostamaa pienestä lähdemateriaalista,
						jonka se on itse hakenut netistä.
					</div>
				</div>
			</div>
		</div>

		<!-- Introduction -->
		<div class="prose max-w-none">
			<p class="text-lg">
				Tämä opas kokoaa yhteen tieteelliseen tutkimukseen, kognitiiviseen tieteeseen ja
				menestyneiden monikielisten ihmisten menetelmiin perustuvia strategioita tehokkaaseen
				kielten oppimiseen. Olipa kyse aikuisesta opiskelijasta tai lapsille opettamisesta, nämä
				lähestymistavat auttavat nopeuttamaan kielen oppimista.
			</p>
		</div>

		<!-- Table of Contents -->
		<div class="card my-8 bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title text-primary">Sisällysluettelo</h3>
				<ul class="menu menu-compact">
					<li><a href="#aikuiset">Todistetusti toimivat strategiat aikuisille</a></li>
					<li><a href="#lapset">Tehokkaat menetelmät lapsille</a></li>
					<li><a href="#yleiset">Yleiset periaatteet (kaikille)</a></li>
					<li><a href="#resurssit">Suositellut oppimisresurssit</a></li>
					<li><a href="#sanasto">Espanjan kielen sanaston ohjeet</a></li>
				</ul>
			</div>
		</div>

		<!-- Adults Section -->
		<div class="card my-8 bg-base-100 shadow-xl" id="aikuiset">
			<div class="card-body">
				<h2 class="card-title mb-4 text-3xl text-primary">
					Todistetusti toimivat strategiat aikuisille
				</h2>

				<div class="space-y-6">
					<!-- Focus on Common Words -->
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Keskity ensin yleisimpiin sanoihin
						</h3>
						<p>
							Tutkimus osoittaa, että pieni määrä sanoja kattaa suurimman osan jokapäiväisestä
							viestinnästä:
						</p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>100 yleisintä sanaa kattaa ~50% päivittäisestä keskustelusta</li>
							<li>300 yleisintä sanaa kattaa ~65% yleisestä puheesta</li>
							<li>1000 yleisintä sanaa kattaa ~85% jokapäiväisestä kielestä</li>
						</ul>
						<div class="alert alert-info mt-3">
							<div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									class="h-6 w-6 shrink-0 stroke-current"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
								<span
									><strong>Toiminta:</strong> Priorisoi yleisimpien sanojen oppiminen ennen
									erikoissanaston laajentamista.</span
								>
							</div>
						</div>
					</div>

					<!-- SRS -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Väliajoin toistuva kertaus (SRS)
						</h3>
						<p>Yksi tieteellisesti vahvistetuimmista tekniikoista sanaston muistamiseen.</p>
						<div class="alert mt-3">
							<div>
								<span>
									<strong>Miten se toimii:</strong> Kertaa sanoja kasvavilla väleillä (1 päivä, 3
									päivää, 1 viikko, 2 viikkoa, 1 kuukausi) siirtääksesi tietoa lyhytaikaisesta
									pitkäaikaismuistiin.
								</span>
							</div>
						</div>
						<p class="mt-3"><strong>Työkalut:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>Anki (ilmainen, muokattavat muistikortit)</li>
							<li>Memrise</li>
							<li>Quizlet</li>
						</ul>
					</div>

					<!-- Comprehensible Input -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Ymmärrettävä syöte (Krashenin teoria)
						</h3>
						<p>
							Kielen omaksuminen tapahtuu, kun olet alttiina sisällölle, joka on hieman nykyistä
							tasoasi korkeammalla ("i+1").
						</p>
						<p class="mt-2"><strong>Kuinka soveltaa:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>Katso ohjelmia tekstityksillä kohdekielellä</li>
							<li>Lue yksinkertaistettuja tekstejä tai uutisia</li>
							<li>Kuuntele oppijoille suunnattuja podcasteja (hidas, selkeä puhe)</li>
							<li>Kasvata vaikeusastetta asteittain edistyessäsi</li>
						</ul>
					</div>

					<!-- Active Production -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Aktiivinen tuottaminen ensimmäisestä päivästä lähtien
						</h3>
						<p>
							Älä odota, kunnes olet "valmis" puhumaan. Tutkimus osoittaa, että varhainen
							puhekäytäntö rakentaa itsevarmuutta ja nopeuttaa oppimista.
						</p>
						<p class="mt-2"><strong>Käytännön lähestymistavat:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>Puhu itsellesi päivittäisten toimintojen aikana</li>
							<li>Käytä kieltenvaihto-sovelluksia (HelloTalk, Tandem)</li>
							<li>Harjoittele varjostamista (toista mitä äidinkieliset puhujat sanovat)</li>
							<li>Nauhoita itsesi ja vertaa äidinkielisiin puhujiin</li>
						</ul>
					</div>

					<!-- Specific Goals -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Aseta tarkkoja, mitattavia tavoitteita
						</h3>
						<p>
							Epämääräiset tavoitteet kuten "parantaa espanjaa" ovat vähemmän tehokkaita kuin
							konkreettiset tavoitteet.
						</p>
						<div class="alert alert-success mt-3">
							<div>
								<span>
									<strong>Esimerkkejä hyvistä tavoitteista:</strong>
									<ul class="mt-2 list-inside list-disc space-y-1">
										<li>"Käydä 15 minuutin keskustelu työstäni maaliskuuhun mennessä"</li>
										<li>"Lukea yksi uutisartikkeli espanjaksi päivittäin"</li>
										<li>"Kirjoittaa 3 lausetta espanjaksi joka aamu"</li>
									</ul>
								</span>
							</div>
						</div>
					</div>

					<!-- Authentic Content -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Ota mukaan aitoa sisältöä</h3>
						<p>Kaventaa kuilua luokkahuoneopetuksen ja tosielämän käytön välillä.</p>
						<p class="mt-2"><strong>Sisältöideoita:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>YouTube-kanavat kohdekielellä</li>
							<li>Podcastit aiheista, jotka kiinnostavat sinua</li>
							<li>Uutissivustot (aloita yksinkertaisemmista)</li>
							<li>Sosiaalisen median tilit kohdekielellä</li>
							<li>Netflix/suoratoistopalvelut kohdekielellä</li>
						</ul>
					</div>

					<!-- Join Communities -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Liity oppimisyhteisöihin</h3>
						<p>Sosiaalinen vuorovaikutus lisää motivaatiota ja tarjoaa vastuullisuutta.</p>
						<p class="mt-2"><strong>Mistä löytää yhteisöjä:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>Kieltenvaihto-sivustot (ConversationExchange, Tandem)</li>
							<li>Reddit-kieltenoppimisyhteisöt (r/Spanish, r/languagelearning)</li>
							<li>Discord-palvelimet kielenoppijoille</li>
							<li>Paikalliset tapaamaisryhmät</li>
						</ul>
					</div>

					<!-- Cultural Immersion -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Kulttuurinen uppoutuminen (kotona)
						</h3>
						<p>Kulttuurin ymmärtäminen syventää kielen ymmärrystä ja motivaatiota.</p>
						<p class="mt-2"><strong>Tapoja upota:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>Valmista perinteisiä reseptejä kulttuurista</li>
							<li>Katso elokuvia ja TV-ohjelmia (ei vain kielitunteja)</li>
							<li>Seuraa sosiaalisen median vaikuttajia kulttuurista</li>
							<li>Kuuntele musiikkia ja lue sanoituksia</li>
							<li>Opi historiasta ja ajankohtaisista tapahtumista</li>
						</ul>
					</div>

					<!-- Consistent Practice -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Johdonmukainen päivittäinen harjoittelu</h3>
						<p>Lyhyet, toistuvat istunnot päihittävät pitkät, harvat istunnot.</p>
						<div class="alert mt-3">
							<div>
								<span>
									<strong>Tutkimuksiin perustuva ajoitus:</strong>
									<ul class="mt-2 list-inside list-disc space-y-1">
										<li>15-30 minuuttia päivittäin on parempi kuin 3 tuntia kerran viikossa</li>
										<li>Aamuopiskelu näyttää paremman muistamisen</li>
										<li>Kertaus ennen nukkumaanmenoa auttaa vahvistumisessa unen aikana</li>
									</ul>
								</span>
							</div>
						</div>
					</div>

					<!-- Multiple Modalities -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Käytä useita modaliteetteja</h3>
						<p>Aktivoi eri aisteja ja oppimistyylejä.</p>
						<p class="mt-2"><strong>Sekoita näitä aktiviteetteja:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>Lukeminen (visuaalinen prosessointi)</li>
							<li>Kuunteleminen (auditiivinen prosessointi)</li>
							<li>Puhuminen (motorinen/kinesteettinen)</li>
							<li>Kirjoittaminen (visuaalis-motorinen prosessointi)</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Children Section -->
		<div class="card my-8 bg-base-100 shadow-xl" id="lapset">
			<div class="card-body">
				<h2 class="card-title mb-4 text-3xl text-primary">Tehokkaat menetelmät lapsille</h2>

				<div class="space-y-6">
					<!-- Play-based Learning -->
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Leikkipohjainen kielten oppiminen
						</h3>
						<p>
							Lapset oppivat parhaiten, kun heillä on hauskaa eivätkä he tajua opiskelevansa.
						</p>
						<p class="mt-2"><strong>Aktiviteetteja:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>Kielirikkaat pelit (Simon sanoo, Minä näen)</li>
							<li>Roolileikkiskenaarioita (ravintola, kauppa, lääkäri)</li>
							<li>Käsityöt kieliohjeilla</li>
							<li>Rakennus-/rakennustoiminta kohdekielen kerronnalla</li>
						</ul>
					</div>

					<!-- Music and Songs -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Musiikki, laulut ja lorut</h3>
						<p>Musiikki aktivoi useita aivoalueita ja tekee muistamisesta helpompaa.</p>
						<p class="mt-2"><strong>Miksi se toimii:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>Rytmi auttaa muistin säilyttämisessä</li>
							<li>Toisto tuntuu luonnolliselta lauluissa</li>
							<li>Emotionaalinen sitoutuminen lisää muistamista</li>
							<li>Ääntäminen paranee laulamisen kautta</li>
						</ul>
					</div>

					<!-- Interactive Storytelling -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Vuorovaikutteinen tarinankerronta ja lukeminen
						</h3>
						<p>
							Jaettu kirjojen lukeminen on yksi tehokkaimmista kielen kehittämisen työkaluista.
						</p>
						<div class="alert alert-success mt-3">
							<div>
								<span>
									<strong>Parhaat käytännöt:</strong>
									<ul class="mt-2 list-inside list-disc space-y-1">
										<li>Lue sama kirja useita kertoja (toisto)</li>
										<li>Kysy avoimia kysymyksiä tarinasta</li>
										<li>Kannusta lasta ennustamaan, mitä tapahtuu seuraavaksi</li>
										<li>Anna lasten "lukea" kuvaamalla kuvia</li>
										<li>Näyttele tarinoita yhdessä</li>
									</ul>
								</span>
							</div>
						</div>
					</div>

					<!-- TPR -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Kokonaisvaltainen fyysinen reaktio (TPR)
						</h3>
						<p>Kielen yhdistäminen fyysiseen liikkeeseen parantaa muistamista.</p>
						<p class="mt-2"><strong>Esimerkkejä:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>"Hyppää!" hyppäämisen aikana</li>
							<li>"Koske nenääsi" toimintojen kanssa</li>
							<li>Tanssivideot ohjeineen kohdekielellä</li>
							<li>Toimintapohjaiset komennot leikin aikana</li>
						</ul>
					</div>

					<!-- Language-rich Environment -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Luo kielirikas ympäristö</h3>
						<p>Jatkuva altistuminen nopeuttaa luonnollista omaksumista.</p>
						<p class="mt-2"><strong>Miten toteuttaa:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>Merkitse kotitavaroi kohdekielellä</li>
							<li>Puhu kohdekieltä tiettyjen toimintojen aikana (ruoka-aika, kylpyhetki)</li>
							<li>Kerro päivittäiset rutiinit yksinkertaisella kielellä</li>
							<li>Soita taustaääntä (tarinoita, lauluja) leikkiajan aikana</li>
						</ul>
					</div>

					<!-- Visual Aids -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Visuaaliset apuvälineet ja assosiaatio
						</h3>
						<p>Lapset ovat erittäin visuaalisia oppijoita.</p>
						<p class="mt-2"><strong>Tekniikoita:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>Kuvakortit sanoilla</li>
							<li>Kuvitetut satukirjat</li>
							<li>Opetusvideoita värikkäillä animaatioilla</li>
							<li>Fyysiset esineet yhdistettynä sanastoon</li>
						</ul>
					</div>

					<!-- Positive Reinforcement -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Positiivinen vahvistus</h3>
						<p>Juhli edistystä, ei täydellisyyttä.</p>
						<div class="alert mt-3">
							<div>
								<span>
									<strong>Tehokkaat lähestymistavat:</strong>
									<ul class="mt-2 list-inside list-disc space-y-1">
										<li>Kehu ponnisteluja, ei vain oikeita vastauksia</li>
										<li>Luo "sanaseinä" näyttämään opittuja sanoja</li>
										<li>Käytä tarrakaavioita tai palkintojärjestelmiä</li>
										<li>Tee virheistä normaali osa oppimista</li>
										<li>Pidä istunnot lyhyinä ja lopeta positiivisella tavalla</li>
									</ul>
								</span>
							</div>
						</div>
					</div>

					<!-- Early Identification -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Haasteiden varhainen tunnistaminen
						</h3>
						<p>Seuraa kielen kehitystä ja puutu asiaan varhain tarvittaessa.</p>
						<div class="alert alert-warning mt-3">
							<div>
								<span>
									<strong>Varoitusmerkkejä:</strong>
									<ul class="mt-2 list-inside list-disc space-y-1">
										<li>Rajoitettu sanasto verrattuna ikätovereihin</li>
										<li>Vaikeus muodostaa lauseita</li>
										<li>Haluttomuus puhua</li>
										<li>Turhautuminen kielitoimintojen aikana</li>
									</ul>
									<p class="mt-2">
										<strong>Toiminta:</strong> Ota yhteyttä puheterapeutteihin, jos huolia ilmenee.
									</p>
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- General Principles -->
		<div class="card my-8 bg-base-100 shadow-xl" id="yleiset">
			<div class="card-body">
				<h2 class="card-title mb-4 text-3xl text-primary">
					Yleiset periaatteet (kaikille ikäryhmille)
				</h2>

				<div class="space-y-6">
					<!-- 80/20 Rule -->
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							80/20-sääntö (Pareton periaate)
						</h3>
						<p>
							Keskity 20%:iin sanastosta, joka antaa sinulle 80% viestintäkyvystä.
						</p>
					</div>

					<!-- Input/Output Balance -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Ymmärrettävä syöte + tuotos tasapaino
						</h3>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>
								<strong>Syöte:</strong> Kuuntelu ja lukeminen (rakentaa sanastoa, kieliopin intuitiota)
							</li>
							<li>
								<strong>Tuotos:</strong> Puhuminen ja kirjoittaminen (vahvistaa tietoa, paljastaa aukkoja)
							</li>
						</ul>
						<p class="mt-2">
							<strong>Ihanteellinen suhde:</strong> 70% syötettä, 30% tuotosta aloittelijoille; siirry
							vähitellen 50/50:een
						</p>
					</div>

					<!-- Forgetting Curve -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Unohduskäyrä</h3>
						<p>Ilman kertausta unohdamme:</p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>50% tunnin sisällä</li>
							<li>70% 24 tunnin sisällä</li>
							<li>90% viikon sisällä</li>
						</ul>
						<div class="alert alert-info mt-3">
							<div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									class="h-6 w-6 shrink-0 stroke-current"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
								<span
									><strong>Ratkaisu:</strong> Säännöllinen kertaus väliajoin toistuvan kertauksen
									avulla estää unohtamisen.</span
								>
							</div>
						</div>
					</div>

					<!-- Context is King -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Konteksti on kuningas</h3>
						<p>
							Erikseen opitut sanat unohtuvat nopeasti. Kontekstissa (lauseissa, tarinoissa,
							keskusteluissa) opitut sanat jäävät mieleen.
						</p>
						<div class="alert mt-3">
							<div>
								<span>
									<strong>Esimerkki:</strong><br />
									❌ "perro = koira" (ulkoaopettelu)<br />
									✅ "Mi perro es pequeño y negro" (konteksti + merkitys + kielioppi)
								</span>
							</div>
						</div>
					</div>

					<!-- Emotional Connection -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Emotionaalinen yhteys</h3>
						<p>Muistamme kokemuksia, jotka liittyvät tunteisiin.</p>
						<p class="mt-2"><strong>Sovella tätä:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>Opi harrastuksiisi ja kiinnostuksen kohteisiisi liittyvää sanastoa</li>
							<li>Yhdistä sanat henkilökohtaisiin muistoihin</li>
							<li>Käytä huumoria, tarinoita tai dramaattisia skenaarioita</li>
							<li>Opiskele aiheita, joista olet intohimoinen</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Resources Section -->
		<div class="card my-8 bg-base-100 shadow-xl" id="resurssit">
			<div class="card-body">
				<h2 class="card-title mb-4 text-3xl text-primary">Suositellut oppimisresurssit</h2>

				<div class="space-y-6">
					<!-- Adults Resources -->
					<div>
						<h3 class="mb-3 text-2xl font-bold text-secondary">Aikuisille</h3>

						<div class="space-y-4">
							<!-- Structured Courses -->
							<div>
								<h4 class="mb-2 font-bold">Strukturoidut kurssit:</h4>
								<ul class="list-inside list-disc space-y-1 pl-4">
									<li>
										<a
											href="https://www.duolingo.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Duolingo
										</a> - Pelillistetyt oppitunnit, ilmainen, loistava aloittelijoille
									</li>
									<li>
										<a
											href="https://www.babbel.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Babbel
										</a> - Keskustelukeskeinen, käytännön fraaseja
									</li>
									<li>
										<a
											href="https://www.busuu.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Busuu
										</a> - Yhteisön palautetta harjoituksista
									</li>
									<li>
										<a
											href="https://www.pimsleur.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Pimsleur
										</a> - Äänipohjainen, keskittyy puhumiseen
									</li>
								</ul>
							</div>

							<!-- SRS Tools -->
							<div>
								<h4 class="mb-2 font-bold">Väliajoin toistuva kertaus:</h4>
								<ul class="list-inside list-disc space-y-1 pl-4">
									<li>
										<a
											href="https://apps.ankiweb.net/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Anki
										</a> - Tehokkain SRS, ilmainen, erittäin muokattava
									</li>
									<li>
										<a
											href="https://www.memrise.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Memrise
										</a> - Sanastoa väliajoin toistuvalla kertauksella
									</li>
									<li>
										<a
											href="https://www.clozemaster.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Clozemaster
										</a> - Kontekstipohjaista sanastoa lauseissa
									</li>
								</ul>
							</div>

							<!-- Comprehensible Input -->
							<div>
								<h4 class="mb-2 font-bold">Ymmärrettävä syöte:</h4>
								<ul class="list-inside list-disc space-y-1 pl-4">
									<li>
										<a
											href="https://www.youtube.com/c/EasySpanish"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Easy Spanish (YouTube)
										</a> - Katuhaastatteluita tekstityksillä
									</li>
									<li>
										<a
											href="https://www.dreamingspanish.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Dreaming Spanish
										</a> - Ymmärrettävän syötteen menetelmä
									</li>
									<li>
										<a
											href="https://www.newsinslowspanish.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											News in Slow Spanish
										</a> - Ajankohtaiset tapahtumat oppijan nopeudella
									</li>
									<li>
										<a
											href="https://www.spanishdict.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											SpanishDict
										</a> - Sanakirja, kielioppi, videot
									</li>
								</ul>
							</div>

							<!-- Language Exchange -->
							<div>
								<h4 class="mb-2 font-bold">Kieltenvaihto:</h4>
								<ul class="list-inside list-disc space-y-1 pl-4">
									<li>
										<a
											href="https://www.hellotalk.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											HelloTalk
										</a> - Teksti/äänichatti äidinkielisten puhujien kanssa
									</li>
									<li>
										<a
											href="https://www.tandem.net/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Tandem
										</a> - Kieltenvaihto-kumppaneita
									</li>
									<li>
										<a
											href="https://www.italki.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											iTalki
										</a> - Edullisia verkkotutorointeja
									</li>
									<li>
										<a
											href="https://www.conversationexchange.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											ConversationExchange
										</a> - Löydä kielikumppaneita
									</li>
								</ul>
							</div>
						</div>
					</div>

					<!-- Children Resources -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-3 text-2xl font-bold text-secondary">Lapsille</h3>

						<div class="space-y-4">
							<!-- Interactive Tools -->
							<div>
								<h4 class="mb-2 font-bold">Vuorovaikutteiset oppimistyökalut:</h4>
								<ul class="list-inside list-disc space-y-1 pl-4">
									<li>
										<a
											href="https://www.duolingo.com/kids"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Duolingo Kids
										</a> - Pelillistetty, ikäsopiva
									</li>
									<li>
										<a
											href="https://www.gusonthego.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Gus on the Go
										</a> - Animoituja sanastopelejä
									</li>
									<li>
										<a
											href="https://www.originatorkids.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Endless Spanish
										</a> - Pulmapohjaista oppimista
									</li>
								</ul>
							</div>

							<!-- Videos and Shows -->
							<div>
								<h4 class="mb-2 font-bold">Videot ja ohjelmat:</h4>
								<ul class="list-inside list-disc space-y-1 pl-4">
									<li><strong>Peppa Possu</strong> (espanjankielinen dubbi) - Yksinkertaista dialogia, arkipäiväisiä tilanteita</li>
									<li><strong>Dora tutkimusmatkailija</strong> - Suunniteltu kielten oppimiseen</li>
									<li>
										<a
											href="https://rockalingua.com/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Rockalingua
										</a> - Opetuksellisia lauluja ja videoita
									</li>
									<li>
										<a
											href="https://www.spanishplayground.net/"
											class="link link-primary"
											target="_blank"
											rel="noopener noreferrer"
										>
											Spanish Playground
										</a> - Videoita ja aktiviteetteja
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Spanish Vocabulary Guidelines -->
		<div class="card my-8 bg-base-100 shadow-xl" id="sanasto">
			<div class="card-body">
				<h2 class="card-title mb-4 text-3xl text-primary">
					Espanjan kielen sanaston ohjeet (tälle projektille)
				</h2>

				<div class="space-y-6">
					<!-- CEFR Framework -->
					<div>
						<h3 class="mb-3 text-2xl font-bold text-secondary">CEFR-viitekehys</h3>
						<p>
							Eurooppalainen viitekehys (CEFR) tarjoaa tutkimuksiin perustuvaa ohjausta sanaston
							omaksumiseen:
						</p>

						<div class="space-y-3 mt-4">
							<!-- A1 Level -->
							<div class="alert">
								<div>
									<span>
										<h4 class="font-bold">A1-taso (Alkeet):</h4>
										<ul class="mt-2 list-inside list-disc space-y-1">
											<li>Suositeltu sanasto: <strong>500-700 sanaa</strong></li>
											<li>
												Ydinaiheet: henkilökohtaiset tiedot, koti ja perhe, ostokset, aika ja
												päivämäärät, ruoka ja juoma, paikat ja suunnat
											</li>
											<li>
												Kyky: Osaa esitellä itsensä, esittää peruskysymyksiä, toimia
												yksinkertaisissa tilanteissa
											</li>
										</ul>
									</span>
								</div>
							</div>

							<!-- A2 Level -->
							<div class="alert">
								<div>
									<span>
										<h4 class="font-bold">A2-taso (Perustason käyttäjä):</h4>
										<ul class="mt-2 list-inside list-disc space-y-1">
											<li>Suositeltu sanasto: <strong>1000-1500 sanaa</strong></li>
											<li>
												Laajennetut aiheet: terveys, harrastukset, liikenne, palvelut,
												ihmissuhteet, menneet kokemukset
											</li>
											<li>
												Kyky: Osaa kuvata kokemuksia, tehdä suunnitelmia, hoitaa
												rutiininomaisia vaihtoja
											</li>
										</ul>
									</span>
								</div>
							</div>

							<!-- B1 Level -->
							<div class="alert">
								<div>
									<span>
										<h4 class="font-bold">B1-taso (Itsenäinen käyttäjä):</h4>
										<ul class="mt-2 list-inside list-disc space-y-1">
											<li>Suositeltu sanasto: <strong>2000-2500 sanaa</strong></li>
											<li>
												Aiheet: Työ, mielipiteet, matkakokemukset, tulevaisuuden suunnitelmat,
												tarinankerronta
											</li>
											<li>
												Kyky: Osaa hoitaa useimmat matkatilanteet, ilmaista mielipiteitä,
												ymmärtää pääkohtia
											</li>
										</ul>
									</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Common Words Strategy -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Yleisten sanojen strategia</h3>
						<p><strong>Tutkimustulokset:</strong></p>
						<ul class="list-inside list-disc space-y-1 pl-4">
							<li>100 yleisintä sanaa kattaa ~<strong>50%</strong> jokapäiväisestä espanjasta</li>
							<li>300 yleisintä sanaa kattaa ~<strong>65%</strong> yleisestä puheesta</li>
							<li>1000 yleisintä sanaa kattaa ~<strong>85%</strong> jokapäiväisestä keskustelusta</li>
							<li>3000 yleisintä sanaa kattaa ~<strong>95%</strong> päivittäisestä viestinnästä</li>
						</ul>

						<div class="alert alert-info mt-3">
							<div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									class="h-6 w-6 shrink-0 stroke-current"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
								<span
									><strong>Johtopäätös oppijoille:</strong> 1000 yleisimmän sanan hallitseminen
									antaa toiminnallisen viestintäkyvyn.</span
								>
							</div>
						</div>
					</div>

					<!-- Espanjapeli Learning Phases -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">
							Espanjapelin oppimisvaiheiden prioriteetti
						</h3>

						<div class="space-y-3">
							<!-- Phase 1 -->
							<div>
								<div class="badge badge-error mb-2">Vaihe 1 (v1.0)</div>
								<p>
									Keskitä konkreettisiin substantiiveihin (ruoka, eläimet, värit, perhe, kehon
									osat), perusverbeihin preesenssissä, ja välttämättömiin tervehdyksiin ja yleisiin
									fraaseihin.
								</p>
							</div>

							<!-- Phase 2 -->
							<div>
								<div class="badge badge-warning mb-2">Vaihe 2 (v2.0 - Suunnitelma)</div>
								<p>Laajenna sisältämään:</p>
								<ul class="list-inside list-disc space-y-1 pl-4">
									<li><strong>Prepositiot ja konnektorit</strong> -kategoria</li>
									<li><strong>Pronominit ja määritteet</strong> -kategoria</li>
									<li><strong>Kysymyssanat</strong> -kategoria</li>
									<li><strong>Yleiset ilmaisut</strong> -kategoria</li>
									<li>Verbien taivutusharjoituksia</li>
									<li>Temaattisia sanastosarjoja (matkailu, ostokset jne.)</li>
								</ul>
							</div>

							<!-- Phase 3 -->
							<div>
								<div class="badge badge-success mb-2">Vaihe 3 (Tulevaisuus)</div>
								<p>
									Lauseenmuodostusharjoitukset, keskusteluharjoittelutila, erikoissanastoa
									kiinnostuksen mukaan (musiikki, urheilu, luonto jne.).
								</p>
							</div>
						</div>
					</div>

					<!-- Word Selection Criteria -->
					<div class="divider"></div>
					<div>
						<h3 class="mb-2 text-xl font-bold text-secondary">Sananvalintakriteerit</h3>
						<p>Lisättäessä uutta sanastoa peliin, priorisoi sanat, jotka ovat:</p>
						<ol class="list-inside list-decimal space-y-1 pl-4">
							<li><strong>Yleisiä</strong> - Käytetään päivittäin todellisissa keskusteluissa</li>
							<li><strong>Toiminnallisia</strong> - Mahdollistavat käytännön viestinnän</li>
							<li><strong>Ikäsopivia</strong> - Sopivia kohdeikäryhmälle</li>
							<li><strong>Kulttuurisesti relevantteja</strong> - Aitoja espanjankielisille konteksteille</li>
							<li>
								<strong>Progressiivisesti haastavia</strong> - Rakentuvat aiemmin opittujen sanojen
								päälle
							</li>
						</ol>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-12 border-t-2 border-base-300 pt-8 text-center text-sm text-base-content/60">
			<p class="mb-2"><strong>Lähteet ja viitteet:</strong></p>
			<ul class="space-y-1">
				<li>CEFR-viralliset ohjeet: Euroopan neuvoston kieliviitekehys</li>
				<li>
					Frekvenssitutkimukset: Perustuvat korpuslinguistiikan tutkimukseen (esim. Corpus del
					Español)
				</li>
				<li>
					Kielenomaksumistutkimus: Akateemiset tutkimukset sanaston omaksumisnopeuksista ja
					menetelmistä
				</li>
				<li>Käytännön testaus: Palaute kielenoppijoilta ja opettajilta</li>
			</ul>
			<p class="mt-6">
				<em>Päivitetty viimeksi: Tammikuu 2025</em><br />
				Tämä opas yhdistää akateemista tutkimusta, kognitiivista tiedettä ja käytännön kokemusta
				menestyksekkäiltä kielenoppijoilta ympäri maailmaa.
			</p>
		</div>
	</div>
</div>



