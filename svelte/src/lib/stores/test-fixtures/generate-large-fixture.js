/**
 * Generate a V4 fixture with 100+ words for migration testing
 */

// Common Spanish words for testing
const spanishWords = [
  'hola', 'adios', 'casa', 'perro', 'gato', 'libro', 'agua', 'comer', 'verde', 'rojo',
  'azul', 'amarillo', 'blanco', 'negro', 'grande', 'pequeño', 'bueno', 'malo', 'nuevo', 'viejo',
  'día', 'noche', 'sol', 'luna', 'estrella', 'cielo', 'tierra', 'mar', 'río', 'montaña',
  'árbol', 'flor', 'planta', 'jardín', 'parque', 'ciudad', 'pueblo', 'calle', 'plaza', 'mercado',
  'padre', 'madre', 'hijo', 'hija', 'hermano', 'hermana', 'abuelo', 'abuela', 'tío', 'tía',
  'amigo', 'niño', 'niña', 'hombre', 'mujer', 'persona', 'gente', 'familia', 'nombre', 'edad',
  'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'cien', 'mil', 'primero', 'segundo', 'tercero', 'último', 'medio', 'todo', 'nada', 'algo',
  'coche', 'bicicleta', 'avión', 'barco', 'tren', 'autobús', 'taxi', 'moto', 'camión', 'metro',
  'comida', 'bebida', 'pan', 'leche', 'café', 'té', 'vino', 'cerveza', 'carne', 'pescado',
  'fruta', 'verdura', 'manzana', 'naranja', 'plátano', 'tomate', 'patata', 'arroz', 'pasta', 'queso',
  'mesa', 'silla', 'cama', 'puerta', 'ventana', 'pared', 'suelo', 'techo', 'cocina', 'baño'
];

function randomScore() {
  return Math.round((Math.random() * 40 + 60) * 10) / 10; // 60-100
}

function randomCount(max = 15) {
  return Math.floor(Math.random() * max) + 1;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

const startDate = new Date('2024-01-01T10:00:00.000Z');
const endDate = new Date('2024-01-31T10:00:00.000Z');

const words = {};
let totalGames = 0;

for (const word of spanishWords) {
  const practiceCount = randomCount(20);
  const firstTryCount = Math.floor(practiceCount * 0.7);
  const secondTryCount = Math.floor(practiceCount * 0.2);
  const thirdTryCount = Math.floor(practiceCount * 0.1);
  const failedCount = practiceCount - firstTryCount - secondTryCount - thirdTryCount;
  
  const firstPracticed = randomDate(startDate, endDate);
  const lastPracticed = randomDate(new Date(firstPracticed), endDate);
  
  words[word] = {
    spanish_to_finnish: {
      basic: {
        score: randomScore(),
        practiceCount,
        firstTryCount,
        secondTryCount,
        thirdTryCount,
        failedCount,
        lastPracticed,
        firstPracticed
      }
    },
    finnish_to_spanish: {}
  };
  
  // Add finnish_to_spanish for some words
  if (Math.random() > 0.5) {
    const ftsPracticeCount = randomCount(15);
    const ftsFirstTryCount = Math.floor(ftsPracticeCount * 0.65);
    const ftsSecondTryCount = Math.floor(ftsPracticeCount * 0.25);
    const ftsThirdTryCount = Math.floor(ftsPracticeCount * 0.1);
    const ftsFailedCount = ftsPracticeCount - ftsFirstTryCount - ftsSecondTryCount - ftsThirdTryCount;
    
    words[word].finnish_to_spanish.basic = {
      score: randomScore(),
      practiceCount: ftsPracticeCount,
      firstTryCount: ftsFirstTryCount,
      secondTryCount: ftsSecondTryCount,
      thirdTryCount: ftsThirdTryCount,
      failedCount: ftsFailedCount,
      lastPracticed: randomDate(new Date(firstPracticed), endDate),
      firstPracticed
    };
  }
  
  // Add kids mode for some words
  if (Math.random() > 0.7) {
    const kidsPracticeCount = randomCount(10);
    const kidsFirstTryCount = Math.floor(kidsPracticeCount * 0.6);
    const kidsSecondTryCount = Math.floor(kidsPracticeCount * 0.3);
    const kidsThirdTryCount = Math.floor(kidsPracticeCount * 0.1);
    const kidsFailedCount = kidsPracticeCount - kidsFirstTryCount - kidsSecondTryCount - kidsThirdTryCount;
    
    words[word].spanish_to_finnish.kids = {
      score: randomScore(),
      practiceCount: kidsPracticeCount,
      firstTryCount: kidsFirstTryCount,
      secondTryCount: kidsSecondTryCount,
      thirdTryCount: kidsThirdTryCount,
      failedCount: kidsFailedCount,
      lastPracticed: randomDate(new Date(firstPracticed), endDate),
      firstPracticed
    };
  }
  
  totalGames += practiceCount;
}

const fixture = {
  version: 4,
  words,
  gameHistory: [],
  meta: {
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: endDate.toISOString(),
    totalGamesPlayed: totalGames,
    basicGamesPlayed: Math.floor(totalGames * 0.8),
    kidsGamesPlayed: Math.floor(totalGames * 0.2)
  }
};

console.log(JSON.stringify(fixture, null, 2));
