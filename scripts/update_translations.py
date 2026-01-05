import json

manifest_path = "/home/lvp/study/espanjapeli/svelte/static/peppa_advanced_spanish_images/image_manifest.json"

with open(manifest_path, 'r') as f:
    manifest = json.load(f)

translations = {
    "i_am_thirsty": {"finnish": "Minulla on jano.", "english": "I am thirsty."},
    "its_cold": {"finnish": "On kylmä.", "english": "It's cold."},
    "its_hot": {"finnish": "On kuuma.", "english": "It's hot."},
    "its_windy": {"finnish": "On tuulista.", "english": "It's windy."},
    "lets_ride_bikes": {"finnish": "Mennään pyöräilemään.", "english": "Let's ride bikes."},
    "lets_play_hide_and_seek": {"finnish": "Pelataan piilosta.", "english": "Let's play hide and seek."},
    "lets_play_ball": {"finnish": "Pelataan palloa.", "english": "Let's play ball."},
    "lets_go_for_a_walk": {"finnish": "Mennään kävelylle.", "english": "Let's go for a walk."},
    "its_recess_time": {"finnish": "On välitunti.", "english": "It's recess time."},
    "its_time_to_sing": {"finnish": "On aika laulaa.", "english": "It's time to sing."},
    "who_wants_ice_cream": {"finnish": "Kuka haluaa jäätelöä?", "english": "Who wants ice cream?"},
    "be_careful": {"finnish": "Ole varovainen.", "english": "Be careful."},
    "dont_worry": {"finnish": "Älä huoli.", "english": "Don't worry."},
    "very_good": {"finnish": "Oikein hyvin!", "english": "Very good!"},
    "how_fun": {"finnish": "Kuinka hauskaa!", "english": "How fun!"},
    "i_am_scared": {"finnish": "Minua pelottaa.", "english": "I am scared."},
    "what_a_fright": {"finnish": "Mikä pelästys!", "english": "What a fright!"},
    "i_like_it": {"finnish": "Tykkään tästä!", "english": "I like it!"},
    "i_dont_like_it": {"finnish": "En tykkää tästä.", "english": "I don't like it."},
    "its_my_turn": {"finnish": "On minun vuoroni.", "english": "It's my turn."}
}

updated_count = 0
for item in manifest['phraseQueue']:
    img_id = item.get('correctImage')
    if img_id in translations and item.get('finnish') == 'TODO':
        item['finnish'] = translations[img_id]['finnish']
        item['english'] = translations[img_id]['english']
        updated_count += 1

with open(manifest_path, 'w') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print(f"Updated {updated_count} translations in manifest.")
