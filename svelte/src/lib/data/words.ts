// Spanish vocabulary database organized by categories
// Ported from vanilla JS to TypeScript

export type PartOfSpeech = 
	| 'noun' 
	| 'verb' 
	| 'adjective' 
	| 'adverb' 
	| 'pronoun'
	| 'preposition' 
	| 'conjunction' 
	| 'interjection'
	| 'article'
	| 'numeral'
	| 'phrase';

export type Gender = 'masculine' | 'feminine';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface FrequencyData {
	rank: number;
	cefrLevel: CEFRLevel;
	isTop100?: boolean;
	isTop500?: boolean;
	isTop1000?: boolean;
	isTop3000?: boolean;
	isTop5000?: boolean;
}

export interface LinguisticData {
	partOfSpeech: PartOfSpeech;
	gender?: Gender;
}

export interface Word {
	spanish: string;
	english: string;
	finnish: string;
	learningTips?: string[];
	
	// V4 optional fields for gradual migration
	id?: string;
	frequency?: FrequencyData;
	linguistic?: LinguisticData;
}

export interface WordCategory {
	name: string;
	words: Word[];
}

export const WORD_CATEGORIES: Record<string, WordCategory> = {
	animals: {
		name: 'Eläimet',
		words: [
			{ spanish: 'perro', english: 'dog', finnish: 'koira', learningTips: ["a1b2c3d4", "e5f6g7h8", "i9j0k1l2"] },
			{ spanish: 'gato', english: 'cat', finnish: 'kissa', learningTips: ["m3n4o5p6", "q7r8s9t0", "u1v2w3x4"] },
			{ spanish: 'pájaro', english: 'bird', finnish: 'lintu' },
			{ spanish: 'pez', english: 'fish', finnish: 'kala' },
			{ spanish: 'caballo', english: 'horse', finnish: 'hevonen' },
			{ spanish: 'vaca', english: 'cow', finnish: 'lehmä' },
			{ spanish: 'cerdo', english: 'pig', finnish: 'sika' },
			{ spanish: 'oveja', english: 'sheep', finnish: 'lammas' },
			{ spanish: 'conejo', english: 'rabbit', finnish: 'kaniini' },
			{ spanish: 'ratón', english: 'mouse', finnish: 'hiiri' },
			{ spanish: 'león', english: 'lion', finnish: 'leijona' },
			{ spanish: 'tigre', english: 'tiger', finnish: 'tiikeri' },
			{ spanish: 'elefante', english: 'elephant', finnish: 'norsu' },
			{ spanish: 'mono', english: 'monkey', finnish: 'apina' },
			{ spanish: 'oso', english: 'bear', finnish: 'karhu' },
			{ spanish: 'lobo', english: 'wolf', finnish: 'susi' },
			{ spanish: 'zorro', english: 'fox', finnish: 'kettu' },
			{ spanish: 'mariposa', english: 'butterfly', finnish: 'perhonen' },
			{ spanish: 'abeja', english: 'bee', finnish: 'mehiläinen' },
			{ spanish: 'araña', english: 'spider', finnish: 'hämähäkki' },
			{ spanish: 'serpiente', english: 'snake', finnish: 'käärme' },
			{ spanish: 'tortuga', english: 'turtle', finnish: 'kilpikonna' },
			{ spanish: 'rana', english: 'frog', finnish: 'sammakko' },
			{ spanish: 'gallina', english: 'chicken', finnish: 'kana' },
			{ spanish: 'pato', english: 'duck', finnish: 'ankka' }
		]
	},
	
	colors: {
		name: 'Värit',
		words: [
			{ spanish: 'rojo', english: 'red', finnish: 'punainen', learningTips: ["w9x0y1z2", "a3b4c5d6", "e7f8g9h0"] },
			{ spanish: 'azul', english: 'blue', finnish: 'sininen', learningTips: ["i1j2k3l4", "m5n6o7p8", "q9r0s1t2"] },
			{ spanish: 'verde', english: 'green', finnish: 'vihreä' },
			{ spanish: 'amarillo', english: 'yellow', finnish: 'keltainen' },
			{ spanish: 'negro', english: 'black', finnish: 'musta' },
			{ spanish: 'blanco', english: 'white', finnish: 'valkoinen' },
			{ spanish: 'naranja', english: 'orange', finnish: 'oranssi' },
			{ spanish: 'morado', english: 'purple', finnish: 'violetti' },
			{ spanish: 'rosa', english: 'pink', finnish: 'vaaleanpunainen' },
			{ spanish: 'gris', english: 'gray', finnish: 'harmaa' },
			{ spanish: 'marrón', english: 'brown', finnish: 'ruskea' }
		]
	},
	
	numbers: {
		name: 'Numerot',
		words: [
			{ spanish: 'uno', english: 'one', finnish: 'yksi' },
			{ spanish: 'dos', english: 'two', finnish: 'kaksi' },
			{ spanish: 'tres', english: 'three', finnish: 'kolme' },
			{ spanish: 'cuatro', english: 'four', finnish: 'neljä' },
			{ spanish: 'cinco', english: 'five', finnish: 'viisi' },
			{ spanish: 'seis', english: 'six', finnish: 'kuusi' },
			{ spanish: 'siete', english: 'seven', finnish: 'seitsemän' },
			{ spanish: 'ocho', english: 'eight', finnish: 'kahdeksan' },
			{ spanish: 'nueve', english: 'nine', finnish: 'yhdeksän' },
			{ spanish: 'diez', english: 'ten', finnish: 'kymmenen' },
			{ spanish: 'veinte', english: 'twenty', finnish: 'kaksikymmentä' },
			{ spanish: 'treinta', english: 'thirty', finnish: 'kolmekymmentä' },
			{ spanish: 'cuarenta', english: 'forty', finnish: 'neljäkymmentä' },
			{ spanish: 'cincuenta', english: 'fifty', finnish: 'viisikymmentä' },
			{ spanish: 'sesenta', english: 'sixty', finnish: 'kuusikymmentä' },
			{ spanish: 'setenta', english: 'seventy', finnish: 'seitsemänkymmentä' },
			{ spanish: 'ochenta', english: 'eighty', finnish: 'kahdeksankymmentä' },
			{ spanish: 'noventa', english: 'ninety', finnish: 'yhdeksänkymmentä' },
			{ spanish: 'cien', english: 'hundred', finnish: 'sata' },
			{ spanish: 'mil', english: 'thousand', finnish: 'tuhat' }
		]
	},
	
	family: {
		name: 'Perhe',
		words: [
			{ spanish: 'padre', english: 'father', finnish: 'isä' },
			{ spanish: 'madre', english: 'mother', finnish: 'äiti' },
			{ spanish: 'hijo', english: 'son', finnish: 'poika' },
			{ spanish: 'hija', english: 'daughter', finnish: 'tytär' },
			{ spanish: 'hermano', english: 'brother', finnish: 'veli' },
			{ spanish: 'hermana', english: 'sister', finnish: 'sisar' },
			{ spanish: 'abuelo', english: 'grandfather', finnish: 'isoisä' },
			{ spanish: 'abuela', english: 'grandmother', finnish: 'isoäiti' },
			{ spanish: 'tío', english: 'uncle', finnish: 'setä' },
			{ spanish: 'tía', english: 'aunt', finnish: 'täti' },
			{ spanish: 'primo', english: 'cousin', finnish: 'serkku' },
			{ spanish: 'bebé', english: 'baby', finnish: 'vauva' }
		]
	},
	
	food: {
		name: 'Ruoka',
		words: [
			{ spanish: 'pan', english: 'bread', finnish: 'leipä' },
			{ spanish: 'agua', english: 'water', finnish: 'vesi', learningTips: ["y5z6a7b8", "c9d0e1f2", "g3h4i5j6"] },
			{ spanish: 'leche', english: 'milk', finnish: 'maito' },
			{ spanish: 'carne', english: 'meat', finnish: 'liha' },
			{ spanish: 'pescado', english: 'fish', finnish: 'kala' },
			{ spanish: 'arroz', english: 'rice', finnish: 'riisi' },
			{ spanish: 'pasta', english: 'pasta', finnish: 'pasta' },
			{ spanish: 'sopa', english: 'soup', finnish: 'keitto' },
			{ spanish: 'ensalada', english: 'salad', finnish: 'salaatti' },
			{ spanish: 'fruta', english: 'fruit', finnish: 'hedelmä' },
			{ spanish: 'manzana', english: 'apple', finnish: 'omena' },
			{ spanish: 'naranja', english: 'orange', finnish: 'appelsiini' },
			{ spanish: 'plátano', english: 'banana', finnish: 'banaani' },
			{ spanish: 'fresa', english: 'strawberry', finnish: 'mansikka' },
			{ spanish: 'uva', english: 'grape', finnish: 'viinirypäle' },
			{ spanish: 'tomate', english: 'tomato', finnish: 'tomaatti' },
			{ spanish: 'patata', english: 'potato', finnish: 'peruna' },
			{ spanish: 'zanahoria', english: 'carrot', finnish: 'porkkana' },
			{ spanish: 'cebolla', english: 'onion', finnish: 'sipuli' },
			{ spanish: 'queso', english: 'cheese', finnish: 'juusto' },
			{ spanish: 'huevo', english: 'egg', finnish: 'muna' },
			{ spanish: 'chocolate', english: 'chocolate', finnish: 'suklaa' },
			{ spanish: 'café', english: 'coffee', finnish: 'kahvi' },
			{ spanish: 'té', english: 'tea', finnish: 'tee' },
			{ spanish: 'jugo', english: 'juice', finnish: 'mehu' }
		,
			{ spanish: 'las frutas', english: 'fruits', finnish: 'hedelmät' },
			{ spanish: 'el café con leche', english: 'coffee with milk', finnish: 'maitokahvi' },
			{ spanish: 'el croissant', english: 'croissant', finnish: 'croissant' },
			{ spanish: 'la tostada', english: 'toast', finnish: 'paahtoleipä' },
			{ spanish: 'el pastel', english: 'pastry', finnish: 'leivos', id: 'pastel', frequency: { rank: 1905, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
			{ spanish: 'la mantequilla', english: 'butter', finnish: 'voi', id: 'mantequilla', frequency: { rank: 4136, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'feminine' } },
			{ spanish: 'la comida', english: 'food', finnish: 'ruoka', id: 'comida', frequency: { rank: 483, cefrLevel: 'A1', isTop500: true, isTop1000: true, isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'feminine' } },
			{ spanish: 'la paella', english: 'paella', finnish: 'paella' },
			{ spanish: 'las tapas', english: 'tapas', finnish: 'tapakset' }
		]
	},
	
	body: {
		name: 'Keho',
		words: [
			{ spanish: 'cabeza', english: 'head', finnish: 'pää' },
			{ spanish: 'cara', english: 'face', finnish: 'kasvot' },
			{ spanish: 'ojo', english: 'eye', finnish: 'silmä' },
			{ spanish: 'nariz', english: 'nose', finnish: 'nenä' },
			{ spanish: 'boca', english: 'mouth', finnish: 'suu' },
			{ spanish: 'oreja', english: 'ear', finnish: 'korva' },
			{ spanish: 'diente', english: 'tooth', finnish: 'hammas' },
			{ spanish: 'lengua', english: 'tongue', finnish: 'kieli' },
			{ spanish: 'cuello', english: 'neck', finnish: 'kaula' },
			{ spanish: 'hombro', english: 'shoulder', finnish: 'hartia' },
			{ spanish: 'brazo', english: 'arm', finnish: 'käsivarsi' },
			{ spanish: 'mano', english: 'hand', finnish: 'käsi' },
			{ spanish: 'dedo', english: 'finger', finnish: 'sormi' },
			{ spanish: 'pierna', english: 'leg', finnish: 'jalka' },
			{ spanish: 'pie', english: 'foot', finnish: 'jalkaterä' },
			{ spanish: 'espalda', english: 'back', finnish: 'selkä' },
			{ spanish: 'pecho', english: 'chest', finnish: 'rinta' },
			{ spanish: 'corazón', english: 'heart', finnish: 'sydän' }
		]
	},
	
	nature: {
		name: 'Luonto',
		words: [
			{ spanish: 'sol', english: 'sun', finnish: 'aurinko' },
			{ spanish: 'luna', english: 'moon', finnish: 'kuu' },
			{ spanish: 'estrella', english: 'star', finnish: 'tähti' },
			{ spanish: 'cielo', english: 'sky', finnish: 'taivas' },
			{ spanish: 'nube', english: 'cloud', finnish: 'pilvi' },
			{ spanish: 'lluvia', english: 'rain', finnish: 'sade' },
			{ spanish: 'nieve', english: 'snow', finnish: 'lumi' },
			{ spanish: 'viento', english: 'wind', finnish: 'tuuli' },
			{ spanish: 'árbol', english: 'tree', finnish: 'puu' },
			{ spanish: 'flor', english: 'flower', finnish: 'kukka' },
			{ spanish: 'hierba', english: 'grass', finnish: 'ruoho' },
			{ spanish: 'hoja', english: 'leaf', finnish: 'lehti' },
			{ spanish: 'montaña', english: 'mountain', finnish: 'vuori' },
			{ spanish: 'río', english: 'river', finnish: 'joki' },
			{ spanish: 'mar', english: 'sea', finnish: 'meri' },
			{ spanish: 'lago', english: 'lake', finnish: 'järvi' },
			{ spanish: 'playa', english: 'beach', finnish: 'ranta' },
			{ spanish: 'bosque', english: 'forest', finnish: 'metsä' },
			{ spanish: 'tierra', english: 'earth', finnish: 'maa' },
			{ spanish: 'piedra', english: 'stone', finnish: 'kivi' },
			{ spanish: 'fuego', english: 'fire', finnish: 'tuli' }
		,
			{ spanish: 'el parque natural', english: 'natural park', finnish: 'luonnonpuisto' },
			{ spanish: 'la ardilla', english: 'squirrel', finnish: 'orava' },
			{ spanish: 'el ciervo', english: 'deer', finnish: 'peura' },
			{ spanish: 'el camping', english: 'campsite', finnish: 'leirintäalue' },
			{ spanish: 'la tienda de campaña', english: 'tent', finnish: 'teltta' },
			{ spanish: 'poner la tienda', english: 'to pitch the tent', finnish: 'pystyttää teltta' },
			{ spanish: 'el paraguas', english: 'umbrella', finnish: 'sateenvarjo' },
			{ spanish: 'nublado', english: 'cloudy', finnish: 'pilvinen' },
			{ spanish: 'el calor', english: 'heat', finnish: 'kuuma / lämpö', id: 'calor', frequency: { rank: 1369, cefrLevel: 'A2', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
			{ spanish: 'el pronóstico', english: 'forecast', finnish: 'sääennuste' },
			{ spanish: 'el grado', english: 'degree', finnish: 'aste', id: 'grado', frequency: { rank: 2545, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } }
		]
	},
	
	home: {
		name: 'Koti',
		words: [
			{ spanish: 'casa', english: 'house', finnish: 'talo', learningTips: ["k7l8m9n0", "o1p2q3r4", "s5t6u7v8"] },
			{ spanish: 'puerta', english: 'door', finnish: 'ovi' },
			{ spanish: 'ventana', english: 'window', finnish: 'ikkuna' },
			{ spanish: 'habitación', english: 'room', finnish: 'huone' },
			{ spanish: 'cocina', english: 'kitchen', finnish: 'keittiö' },
			{ spanish: 'baño', english: 'bathroom', finnish: 'kylpyhuone' },
			{ spanish: 'cama', english: 'bed', finnish: 'sänky' },
			{ spanish: 'mesa', english: 'table', finnish: 'pöytä' },
			{ spanish: 'silla', english: 'chair', finnish: 'tuoli' },
			{ spanish: 'sofá', english: 'sofa', finnish: 'sohva' },
			{ spanish: 'lámpara', english: 'lamp', finnish: 'lamppu' },
			{ spanish: 'televisión', english: 'television', finnish: 'televisio' },
			{ spanish: 'computadora', english: 'computer', finnish: 'tietokone' },
			{ spanish: 'teléfono', english: 'telephone', finnish: 'puhelin' },
			{ spanish: 'libro', english: 'book', finnish: 'kirja' },
			{ spanish: 'jardín', english: 'garden', finnish: 'puutarha' },
			{ spanish: 'techo', english: 'roof', finnish: 'katto' },
			{ spanish: 'pared', english: 'wall', finnish: 'seinä' },
			{ spanish: 'suelo', english: 'floor', finnish: 'lattia' }
		]
	},
	
	school: {
		name: 'Koulu',
		words: [
			{ spanish: 'escuela', english: 'school', finnish: 'koulu' },
			{ spanish: 'maestro', english: 'teacher', finnish: 'opettaja' },
			{ spanish: 'estudiante', english: 'student', finnish: 'opiskelija' },
			{ spanish: 'clase', english: 'class', finnish: 'luokka' },
			{ spanish: 'libro', english: 'book', finnish: 'kirja' },
			{ spanish: 'cuaderno', english: 'notebook', finnish: 'vihko' },
			{ spanish: 'lápiz', english: 'pencil', finnish: 'lyijykynä' },
			{ spanish: 'pluma', english: 'pen', finnish: 'kynä' },
			{ spanish: 'papel', english: 'paper', finnish: 'paperi' },
			{ spanish: 'pizarra', english: 'blackboard', finnish: 'liitutaulu' },
			{ spanish: 'escritorio', english: 'desk', finnish: 'kirjoituspöytä' },
			{ spanish: 'mochila', english: 'backpack', finnish: 'reppu' },
			{ spanish: 'examen', english: 'exam', finnish: 'koe' },
			{ spanish: 'tarea', english: 'homework', finnish: 'kotitehtävä' }
		]
	},
	
	verbs: {
		name: 'Verbit',
		words: [
			{ spanish: 'ser', english: 'to be', finnish: 'olla' },
			{ spanish: 'estar', english: 'to be', finnish: 'olla' },
			{ spanish: 'tener', english: 'to have', finnish: 'omistaa' },
			{ spanish: 'hacer', english: 'to do', finnish: 'tehdä' },
			{ spanish: 'ir', english: 'to go', finnish: 'mennä' },
			{ spanish: 'venir', english: 'to come', finnish: 'tulla' },
			{ spanish: 'ver', english: 'to see', finnish: 'nähdä' },
			{ spanish: 'decir', english: 'to say', finnish: 'sanoa' },
			{ spanish: 'dar', english: 'to give', finnish: 'antaa' },
			{ spanish: 'saber', english: 'to know', finnish: 'tietää' },
			{ spanish: 'querer', english: 'to want', finnish: 'haluta' },
			{ spanish: 'poder', english: 'can', finnish: 'voida' },
			{ spanish: 'comer', english: 'to eat', finnish: 'syödä' },
			{ spanish: 'beber', english: 'to drink', finnish: 'juoda' },
			{ spanish: 'hablar', english: 'to speak', finnish: 'puhua' },
			{ spanish: 'escribir', english: 'to write', finnish: 'kirjoittaa' },
			{ spanish: 'leer', english: 'to read', finnish: 'lukea' },
			{ spanish: 'correr', english: 'to run', finnish: 'juosta' },
			{ spanish: 'caminar', english: 'to walk', finnish: 'kävellä' },
			{ spanish: 'dormir', english: 'to sleep', finnish: 'nukkua' },
			{ spanish: 'vivir', english: 'to live', finnish: 'elää' },
			{ spanish: 'trabajar', english: 'to work', finnish: 'työskennellä' },
			{ spanish: 'jugar', english: 'to play', finnish: 'leikkiä' },
			{ spanish: 'cantar', english: 'to sing', finnish: 'laulaa' },
			{ spanish: 'bailar', english: 'to dance', finnish: 'tanssia' }
		,
			{ spanish: 'servir', english: 'to serve', finnish: 'tarjoilla', id: 'servir', frequency: { rank: 2751, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'verb' } },
			{ spanish: 'sentarse', english: 'to sit down', finnish: 'istua', id: 'sentarse', frequency: { rank: 3401, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'verb' } },
			{ spanish: 'disfrutar', english: 'to enjoy', finnish: 'nauttia', id: 'disfrutar', frequency: { rank: 3258, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'verb' } },
			{ spanish: 'alquilar', english: 'to rent', finnish: 'vuokrata' },
			{ spanish: 'devolver', english: 'to return', finnish: 'palauttaa', id: 'devolver', frequency: { rank: 3949, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'verb' } },
			{ spanish: 'cerrar', english: 'to close', finnish: 'sulkea', id: 'cerrar', frequency: { rank: 1798, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'verb' } },
			{ spanish: 'nadar', english: 'to swim', finnish: 'uida', id: 'nadar', frequency: { rank: 3141, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'verb' } },
			{ spanish: 'llover', english: 'to rain', finnish: 'sataa' },
			{ spanish: 'pasear', english: 'to walk', finnish: 'kävellä / ulkoilla' },
			{ spanish: 'cenar', english: 'to have dinner', finnish: 'syödä illallista', id: 'cenar', frequency: { rank: 1100, cefrLevel: 'A2', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'verb' } },
			{ spanish: 'girar', english: 'to turn', finnish: 'kääntyä' }
		]
	},
	
	time: {
		name: 'Aika',
		words: [
			{ spanish: 'día', english: 'day', finnish: 'päivä' },
			{ spanish: 'noche', english: 'night', finnish: 'yö' },
			{ spanish: 'mañana', english: 'morning', finnish: 'aamu' },
			{ spanish: 'tarde', english: 'afternoon', finnish: 'iltapäivä' },
			{ spanish: 'hora', english: 'hour', finnish: 'tunti' },
			{ spanish: 'minuto', english: 'minute', finnish: 'minuutti' },
			{ spanish: 'semana', english: 'week', finnish: 'viikko' },
			{ spanish: 'mes', english: 'month', finnish: 'kuukausi' },
			{ spanish: 'año', english: 'year', finnish: 'vuosi' },
			{ spanish: 'hoy', english: 'today', finnish: 'tänään' },
			{ spanish: 'ayer', english: 'yesterday', finnish: 'eilen' },
			{ spanish: 'lunes', english: 'monday', finnish: 'maanantai' },
			{ spanish: 'martes', english: 'tuesday', finnish: 'tiistai' },
			{ spanish: 'miércoles', english: 'wednesday', finnish: 'keskiviikko' },
			{ spanish: 'jueves', english: 'thursday', finnish: 'torstai' },
			{ spanish: 'viernes', english: 'friday', finnish: 'perjantai' },
			{ spanish: 'sábado', english: 'saturday', finnish: 'lauantai' },
			{ spanish: 'domingo', english: 'sunday', finnish: 'sunnuntai' }
		]
	},
	
	adjectives: {
		name: 'Adjektiivit',
		words: [
			{ spanish: 'grande', english: 'big', finnish: 'iso' },
			{ spanish: 'pequeño', english: 'small', finnish: 'pieni' },
			{ spanish: 'alto', english: 'tall', finnish: 'korkea' },
			{ spanish: 'bajo', english: 'short', finnish: 'lyhyt' },
			{ spanish: 'largo', english: 'long', finnish: 'pitkä' },
			{ spanish: 'corto', english: 'short', finnish: 'lyhyt' },
			{ spanish: 'nuevo', english: 'new', finnish: 'uusi' },
			{ spanish: 'viejo', english: 'old', finnish: 'vanha' },
			{ spanish: 'joven', english: 'young', finnish: 'nuori' },
			{ spanish: 'bueno', english: 'good', finnish: 'hyvä' },
			{ spanish: 'malo', english: 'bad', finnish: 'paha' },
			{ spanish: 'bonito', english: 'pretty', finnish: 'kaunis' },
			{ spanish: 'feo', english: 'ugly', finnish: 'ruma' },
			{ spanish: 'feliz', english: 'happy', finnish: 'onnellinen' },
			{ spanish: 'triste', english: 'sad', finnish: 'surullinen' },
			{ spanish: 'rápido', english: 'fast', finnish: 'nopea' },
			{ spanish: 'lento', english: 'slow', finnish: 'hidas' },
			{ spanish: 'caliente', english: 'hot', finnish: 'kuuma' },
			{ spanish: 'frío', english: 'cold', finnish: 'kylmä' },
			{ spanish: 'fácil', english: 'easy', finnish: 'helppo' },
			{ spanish: 'difícil', english: 'difficult', finnish: 'vaikea' }
		,
			{ spanish: 'fresco/a', english: '[tuore]', finnish: 'tuore' },
			{ spanish: 'pequeño/a', english: '[pieni]', finnish: 'pieni' },
			{ spanish: 'plano/a', english: '[tasainen]', finnish: 'tasainen' },
			{ spanish: 'típico/a', english: '[tyypillinen]', finnish: 'tyypillinen' },
			{ spanish: 'caro/a', english: '[kallis]', finnish: 'kallis' },
			{ spanish: 'vegetariano/a', english: '[kasvis-]', finnish: 'kasvis-' }
		]
	},
	
	common: {
		name: 'Yleisiä sanoja',
		words: [
			{ spanish: 'sí', english: 'yes', finnish: 'kyllä' },
			{ spanish: 'no', english: 'no', finnish: 'ei' },
			{ spanish: 'hola', english: 'hello', finnish: 'hei', learningTips: ["u3v4w5x6", "y7z8a9b0", "c1d2e3f4"] },
			{ spanish: 'adiós', english: 'goodbye', finnish: 'näkemiin' },
			{ spanish: 'gracias', english: 'thank you', finnish: 'kiitos', learningTips: ["g5h6i7j8", "k9l0m1n2", "o3p4q5r6"] },
			{ spanish: 'por favor', english: 'please', finnish: 'ole hyvä' },
			{ spanish: 'perdón', english: 'sorry', finnish: 'anteeksi' },
			{ spanish: 'de nada', english: 'you\'re welcome', finnish: 'ole hyvä' },
			{ spanish: 'nombre', english: 'name', finnish: 'nimi' },
			{ spanish: 'amigo', english: 'friend', finnish: 'ystävä' },
			{ spanish: 'mujer', english: 'woman', finnish: 'nainen' },
			{ spanish: 'hombre', english: 'man', finnish: 'mies' },
			{ spanish: 'niño', english: 'boy', finnish: 'poika' },
			{ spanish: 'niña', english: 'girl', finnish: 'tyttö' },
			{ spanish: 'persona', english: 'person', finnish: 'henkilö' },
			{ spanish: 'gente', english: 'people', finnish: 'ihmiset' },
			{ spanish: 'cosa', english: 'thing', finnish: 'asia' },
			{ spanish: 'lugar', english: 'place', finnish: 'paikka' },
			{ spanish: 'tiempo', english: 'time', finnish: 'aika' },
			{ spanish: 'vida', english: 'life', finnish: 'elämä' },
			{ spanish: 'mundo', english: 'world', finnish: 'maailma' },
			{ spanish: 'ahora', english: 'now', finnish: 'nyt' },
			{ spanish: 'después', english: 'later', finnish: 'myöhemmin' },
			{ spanish: 'siempre', english: 'always', finnish: 'aina' },
			{ spanish: 'nunca', english: 'never', finnish: 'ei koskaan' },
			{ spanish: 'más', english: 'more', finnish: 'enemmän' },
			{ spanish: 'menos', english: 'less', finnish: 'vähemmän' },
			{ spanish: 'muy', english: 'very', finnish: 'hyvin' },
			{ spanish: 'mucho', english: 'much', finnish: 'paljon' },
			{ spanish: 'poco', english: 'little', finnish: 'vähän' },
			{ spanish: 'también', english: 'also', finnish: 'myös' },
			{ spanish: 'tampoco', english: 'neither', finnish: 'ei myöskään' },
			{ spanish: 'claro', english: 'of course', finnish: 'tietenkin' },
			{ spanish: 'bien', english: 'well', finnish: 'hyvin' },
			{ spanish: 'mal', english: 'bad', finnish: 'huonosti' },
			{ spanish: 'mejor', english: 'better', finnish: 'parempi' },
			{ spanish: 'peor', english: 'worse', finnish: 'huonompi' },
			{ spanish: 'algo', english: 'something', finnish: 'jotain' },
			{ spanish: 'nada', english: 'nothing', finnish: 'ei mitään' },
			{ spanish: 'todo', english: 'everything', finnish: 'kaikki' },
			{ spanish: 'alguien', english: 'someone', finnish: 'joku' },
			{ spanish: 'nadie', english: 'nobody', finnish: 'ei kukaan' }
		]
	},
	
	pronouns: {
		name: 'Pronominit',
		words: [
			{ spanish: 'yo', english: 'I', finnish: 'minä' },
			{ spanish: 'tú', english: 'you (informal)', finnish: 'sinä' },
			{ spanish: 'usted', english: 'you (formal)', finnish: 'Te' },
			{ spanish: 'él', english: 'he', finnish: 'hän' },
			{ spanish: 'ella', english: 'she', finnish: 'hän' },
			{ spanish: 'nosotros', english: 'we', finnish: 'me' },
			{ spanish: 'vosotros', english: 'you (plural)', finnish: 'te' },
			{ spanish: 'ellos', english: 'they (m)', finnish: 'he' },
			{ spanish: 'ellas', english: 'they (f)', finnish: 'he' },
			{ spanish: 'me', english: 'me', finnish: 'minua' },
			{ spanish: 'te', english: 'you', finnish: 'sinua' },
			{ spanish: 'nos', english: 'us', finnish: 'meitä' },
			{ spanish: 'mi', english: 'my', finnish: 'minun' },
			{ spanish: 'tu', english: 'your', finnish: 'sinun' },
			{ spanish: 'su', english: 'his/her/their', finnish: 'hänen' },
			{ spanish: 'nuestro', english: 'our', finnish: 'meidän' },
			{ spanish: 'este', english: 'this (m)', finnish: 'tämä' },
			{ spanish: 'esta', english: 'this (f)', finnish: 'tämä' },
			{ spanish: 'ese', english: 'that (m)', finnish: 'tuo' },
			{ spanish: 'esa', english: 'that (f)', finnish: 'tuo' }
		]
	},
	
	prepositions: {
		name: 'Prepositiot ja konjunktiot',
		words: [
			{ spanish: 'en', english: 'in', finnish: 'sisällä' },
			{ spanish: 'de', english: 'of/from', finnish: '-sta/-stä' },
			{ spanish: 'a', english: 'to', finnish: '-lle/-lla' },
			{ spanish: 'con', english: 'with', finnish: 'kanssa' },
			{ spanish: 'sin', english: 'without', finnish: 'ilman' },
			{ spanish: 'para', english: 'for', finnish: 'varten' },
			{ spanish: 'por', english: 'for/by', finnish: 'kautta' },
			{ spanish: 'sobre', english: 'about/on', finnish: 'päällä' },
			{ spanish: 'bajo', english: 'under', finnish: 'alla' },
			{ spanish: 'entre', english: 'between', finnish: 'välissä' },
			{ spanish: 'hasta', english: 'until', finnish: 'asti' },
			{ spanish: 'desde', english: 'since/from', finnish: 'lähtien' },
			{ spanish: 'y', english: 'and', finnish: 'ja' },
			{ spanish: 'o', english: 'or', finnish: 'tai' },
			{ spanish: 'pero', english: 'but', finnish: 'mutta' },
			{ spanish: 'porque', english: 'because', finnish: 'koska' },
			{ spanish: 'si', english: 'if', finnish: 'jos' },
			{ spanish: 'cuando', english: 'when', finnish: 'kun' },
			{ spanish: 'donde', english: 'where', finnish: 'missä' },
			{ spanish: 'como', english: 'how/as', finnish: 'miten' },
			{ spanish: 'que', english: 'that/what', finnish: 'että' }
		]
	},
	
	questions: {
		name: 'Kysymyssanat',
		words: [
			{ spanish: 'qué', english: 'what', finnish: 'mikä' },
			{ spanish: 'quién', english: 'who', finnish: 'kuka' },
			{ spanish: 'cuándo', english: 'when', finnish: 'milloin' },
			{ spanish: 'dónde', english: 'where', finnish: 'missä' },
			{ spanish: 'por qué', english: 'why', finnish: 'miksi' },
			{ spanish: 'cómo', english: 'how', finnish: 'miten' },
			{ spanish: 'cuánto', english: 'how much', finnish: 'kuinka paljon' },
			{ spanish: 'cuántos', english: 'how many', finnish: 'kuinka monta' },
			{ spanish: 'cuál', english: 'which', finnish: 'kumpi' },
			{ spanish: 'cuáles', english: 'which (plural)', finnish: 'mitkä' }
		]
	},
	
	places: {
		name: 'Paikat',
		words: [
			{ spanish: 'ciudad', english: 'city', finnish: 'kaupunki' },
			{ spanish: 'pueblo', english: 'town', finnish: 'kylä' },
			{ spanish: 'calle', english: 'street', finnish: 'katu' },
			{ spanish: 'tienda', english: 'store', finnish: 'kauppa' },
			{ spanish: 'supermercado', english: 'supermarket', finnish: 'ruokakauppa' },
			{ spanish: 'restaurante', english: 'restaurant', finnish: 'ravintola' },
			{ spanish: 'café', english: 'cafe', finnish: 'kahvila' },
			{ spanish: 'hospital', english: 'hospital', finnish: 'sairaala' },
			{ spanish: 'farmacia', english: 'pharmacy', finnish: 'apteekki' },
			{ spanish: 'banco', english: 'bank', finnish: 'pankki' },
			{ spanish: 'correos', english: 'post office', finnish: 'posti' },
			{ spanish: 'aeropuerto', english: 'airport', finnish: 'lentokenttä' },
			{ spanish: 'estación', english: 'station', finnish: 'asema' },
			{ spanish: 'hotel', english: 'hotel', finnish: 'hotelli' },
			{ spanish: 'iglesia', english: 'church', finnish: 'kirkko' },
			{ spanish: 'parque', english: 'park', finnish: 'puisto' },
			{ spanish: 'museo', english: 'museum', finnish: 'museo' },
			{ spanish: 'biblioteca', english: 'library', finnish: 'kirjasto' },
			{ spanish: 'oficina', english: 'office', finnish: 'toimisto' },
			{ spanish: 'mercado', english: 'market', finnish: 'tori' }
		,
			{ spanish: 'el hostal', english: 'hostel', finnish: 'hostelli' },
			{ spanish: 'la reserva', english: 'reservation', finnish: 'varaus', id: 'reserva', frequency: { rank: 3405, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'feminine' } },
			{ spanish: 'la ducha', english: 'shower', finnish: 'suihku', id: 'ducha', frequency: { rank: 2822, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'feminine' } },
			{ spanish: 'el desayuno', english: 'breakfast', finnish: 'aamiainen', id: 'desayuno', frequency: { rank: 1953, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
			{ spanish: 'la llave', english: 'key', finnish: 'avain', id: 'llave', frequency: { rank: 1131, cefrLevel: 'A2', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'feminine' } }
		]
	},
	
	transportation: {
		name: 'Liikenne',
		words: [
			{ spanish: 'coche', english: 'car', finnish: 'auto' },
			{ spanish: 'autobús', english: 'bus', finnish: 'bussi' },
			{ spanish: 'tren', english: 'train', finnish: 'juna' },
			{ spanish: 'avión', english: 'plane', finnish: 'lentokone' },
			{ spanish: 'bicicleta', english: 'bicycle', finnish: 'polkupyörä' },
			{ spanish: 'taxi', english: 'taxi', finnish: 'taksi' },
			{ spanish: 'metro', english: 'subway', finnish: 'metro' },
			{ spanish: 'barco', english: 'boat', finnish: 'vene' },
			{ spanish: 'moto', english: 'motorcycle', finnish: 'moottoripyörä' },
			{ spanish: 'viaje', english: 'trip', finnish: 'matka' },
			{ spanish: 'pasaporte', english: 'passport', finnish: 'passi' },
			{ spanish: 'billete', english: 'ticket', finnish: 'lippu' },
			{ spanish: 'maleta', english: 'suitcase', finnish: 'matkalaukku' }
		]
	},
	
	clothing: {
		name: 'Vaatteet',
		words: [
			{ spanish: 'ropa', english: 'clothes', finnish: 'vaatteet' },
			{ spanish: 'camisa', english: 'shirt', finnish: 'paita' },
			{ spanish: 'camiseta', english: 't-shirt', finnish: 't-paita' },
			{ spanish: 'pantalón', english: 'pants', finnish: 'housut' },
			{ spanish: 'falda', english: 'skirt', finnish: 'hame' },
			{ spanish: 'vestido', english: 'dress', finnish: 'mekko' },
			{ spanish: 'zapato', english: 'shoe', finnish: 'kenkä' },
			{ spanish: 'calcetín', english: 'sock', finnish: 'sukka' },
			{ spanish: 'chaqueta', english: 'jacket', finnish: 'takki' },
			{ spanish: 'abrigo', english: 'coat', finnish: 'takki' },
			{ spanish: 'sombrero', english: 'hat', finnish: 'hattu' },
			{ spanish: 'gafas', english: 'glasses', finnish: 'lasit' },
			{ spanish: 'reloj', english: 'watch', finnish: 'kello' }
		]
	},
	
	emotions: {
		name: 'Tunteet ja tilat',
		words: [
			{ spanish: 'feliz', english: 'happy', finnish: 'onnellinen' },
			{ spanish: 'triste', english: 'sad', finnish: 'surullinen' },
			{ spanish: 'cansado', english: 'tired', finnish: 'väsynyt' },
			{ spanish: 'enfermo', english: 'sick', finnish: 'sairas' },
			{ spanish: 'sano', english: 'healthy', finnish: 'terve' },
			{ spanish: 'amor', english: 'love', finnish: 'rakkaus' },
			{ spanish: 'miedo', english: 'fear', finnish: 'pelko' },
			{ spanish: 'alegría', english: 'joy', finnish: 'ilo' },
			{ spanish: 'enojado', english: 'angry', finnish: 'vihainen' },
			{ spanish: 'preocupado', english: 'worried', finnish: 'huolissaan' },
			{ spanish: 'contento', english: 'content', finnish: 'tyytyväinen' },
			{ spanish: 'nervioso', english: 'nervous', finnish: 'hermostunut' },
			{ spanish: 'aburrido', english: 'bored', finnish: 'tylsistynyt' }
		]
	},
	
	professions: {
		name: 'Ammatit',
		words: [
			{ spanish: 'trabajo', english: 'work/job', finnish: 'työ' },
			{ spanish: 'médico', english: 'doctor', finnish: 'lääkäri' },
			{ spanish: 'enfermera', english: 'nurse', finnish: 'sairaanhoitaja' },
			{ spanish: 'profesor', english: 'teacher', finnish: 'opettaja' },
			{ spanish: 'abogado', english: 'lawyer', finnish: 'lakimies' },
			{ spanish: 'ingeniero', english: 'engineer', finnish: 'insinööri' },
			{ spanish: 'artista', english: 'artist', finnish: 'taiteilija' },
			{ spanish: 'músico', english: 'musician', finnish: 'muusikko' },
			{ spanish: 'policía', english: 'police', finnish: 'poliisi' },
			{ spanish: 'cocinero', english: 'cook', finnish: 'kokki' },
			{ spanish: 'camarero', english: 'waiter', finnish: 'tarjoilija' },
			{ spanish: 'vendedor', english: 'salesperson', finnish: 'myyjä' }
		]
	},
	
	money: {
		name: 'Raha ja ostokset',
		words: [
			{ spanish: 'dinero', english: 'money', finnish: 'raha' },
			{ spanish: 'precio', english: 'price', finnish: 'hinta' },
			{ spanish: 'euro', english: 'euro', finnish: 'euro' },
			{ spanish: 'comprar', english: 'to buy', finnish: 'ostaa' },
			{ spanish: 'vender', english: 'to sell', finnish: 'myydä' },
			{ spanish: 'pagar', english: 'to pay', finnish: 'maksaa' },
			{ spanish: 'caro', english: 'expensive', finnish: 'kallis' },
			{ spanish: 'barato', english: 'cheap', finnish: 'halpa' },
			{ spanish: 'gratis', english: 'free', finnish: 'ilmainen' },
		{ spanish: 'cuenta', english: 'bill', finnish: 'lasku' },
		{ spanish: 'tarjeta', english: 'card', finnish: 'kortti' }
	]
},
	
	stories: {
		name: 'Tarinoista',
		words: [
		{ spanish: 'el pasillo', english: 'aisle', finnish: 'käytävä', id: 'pasillo', frequency: { rank: 2730, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
		{ spanish: 'la entrada', english: 'entrance', finnish: 'sisäänkäynti', id: 'entrada', frequency: { rank: 1316, cefrLevel: 'A2', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'feminine' } },
		{ spanish: 'el kilo', english: 'kilo', finnish: 'kilo' },
		{ spanish: 'el efectivo', english: 'cash', finnish: 'käteinen', id: 'efectivo', frequency: { rank: 2203, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
		{ spanish: 'la caja', english: 'cash register', finnish: 'kassa', id: 'caja', frequency: { rank: 803, cefrLevel: 'A2', isTop1000: true, isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'feminine' } },
		{ spanish: 'la cafetería', english: 'cafeteria', finnish: 'kahvila', id: 'cafetería', frequency: { rank: 4574, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'feminine' } },
		{ spanish: 'la terraza', english: 'terrace', finnish: 'terassi' },
		{ spanish: 'el casco', english: 'helmet', finnish: 'kypärä', id: 'casco', frequency: { rank: 4321, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
		{ spanish: 'el mapa', english: 'map', finnish: 'kartta', id: 'mapa', frequency: { rank: 2241, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
		{ spanish: 'la ruta', english: 'route', finnish: 'reitti', id: 'ruta', frequency: { rank: 2736, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'feminine' } },
		{ spanish: 'el depósito', english: 'deposit', finnish: 'panttimaksu', id: 'depósito', frequency: { rank: 3520, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
		{ spanish: 'doble', english: 'double', finnish: 'kahden hengen', id: 'doble', frequency: { rank: 1317, cefrLevel: 'A2', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun' } },
		{ spanish: 'el aire acondicionado', english: 'air conditioning', finnish: 'ilmastointi' },
		{ spanish: 'el comedor', english: 'dining room', finnish: 'ruokasali' },
		{ spanish: 'la hora de salida', english: 'checkout time', finnish: 'uloskirjautumisaika' },
		{ spanish: 'el área de picnic', english: 'picnic area', finnish: 'piknik-alue' },
		{ spanish: 'prohibido', english: 'prohibited', finnish: 'kielletty', id: 'prohibido', frequency: { rank: 3844, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'noun' } },
		{ spanish: 'el sitio', english: 'place', finnish: 'paikka', id: 'sitio', frequency: { rank: 558, cefrLevel: 'A2', isTop1000: true, isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
		{ spanish: 'los servicios', english: 'facilities', finnish: 'saniteettitilat', id: 'servicios', frequency: { rank: 2589, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
		{ spanish: 'el agua caliente', english: 'hot water', finnish: 'kuuma vesi' },
		{ spanish: 'la barbacoa', english: 'barbecue', finnish: 'grilli' },
		{ spanish: 'el silencio', english: 'silence', finnish: 'hiljaisuus', id: 'silencio', frequency: { rank: 904, cefrLevel: 'A2', isTop1000: true, isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
		{ spanish: 'el horario', english: 'schedule', finnish: 'aikataulu', id: 'horario', frequency: { rank: 4448, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } },
		{ spanish: 'razonable', english: 'reasonable', finnish: 'kohtuullinen', id: 'razonable', frequency: { rank: 3696, cefrLevel: 'B2', isTop5000: true }, linguistic: { partOfSpeech: 'noun' } },
		{ spanish: 'el almuerzo', english: 'lunch', finnish: 'lounas', id: 'almuerzo', frequency: { rank: 1898, cefrLevel: 'B1', isTop3000: true, isTop5000: true }, linguistic: { partOfSpeech: 'noun', gender: 'masculine' } }
		]
	},
	
};

// Get all words from a category
export function getWordsFromCategory(categoryKey: string): Word[] {
	return WORD_CATEGORIES[categoryKey]?.words || [];
}

// Get all words from all categories
export function getAllWords(): Word[] {
	const allWords: Word[] = [];
	for (const categoryKey in WORD_CATEGORIES) {
		allWords.push(...WORD_CATEGORIES[categoryKey].words);
	}
	return allWords;
}

// Get random word from category (with exclusion list)
export function getRandomWordFromCategory(categoryKey: string, excludeWords: string[] = []): Word | null {
	const words = getWordsFromCategory(categoryKey);
	const availableWords = words.filter(w => !excludeWords.includes(w.spanish));
	
	if (availableWords.length === 0) return null;
	
	const randomIndex = Math.floor(Math.random() * availableWords.length);
	return availableWords[randomIndex];
}

// Get all category keys
export function getCategoryKeys(): string[] {
	return Object.keys(WORD_CATEGORIES);
}

// Get category display name
export function getCategoryName(categoryKey: string): string {
	return WORD_CATEGORIES[categoryKey]?.name || categoryKey;
}

