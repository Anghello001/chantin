import { Category, GameMode } from '../types/game';

export const CLASSIC_CATEGORIES: Category[] = [
  { id: 'nombre', name: 'Nombre', icon: '👤', placeholder: 'Ej: Carlos, Camila, Daniel...', validationType: 'subjective' },
  { id: 'apellido', name: 'Apellido', icon: '🏷️', placeholder: 'Ej: Castillo, Castro, Morales...', validationType: 'subjective' },
  { id: 'ciudad_pais', name: 'País o Ciudad', icon: '🌍', placeholder: 'Ej: Colombia, Canadá, Madrid...', validationType: 'subjective' },
  { id: 'animal', name: 'Animal', icon: '🦁', placeholder: 'Ej: Camello, Canguro, León...', validationType: 'dictionary' },
  { id: 'fruta_verdura', name: 'Fruta / Verdura', icon: '🍎', placeholder: 'Ej: Cereza, Coco, Manzana...', validationType: 'dictionary' },
  { id: 'cosa', name: 'Cosa / Objeto', icon: '📦', placeholder: 'Ej: Cuaderno, Cuchara, Reloj...', validationType: 'dictionary' },
  { id: 'color', name: 'Color', icon: '🎨', placeholder: 'Ej: Celeste, Carmesí, Verde...', validationType: 'dictionary' },
];

export const POP_CULTURE_CATEGORIES: Category[] = [
  { id: 'pelicula_serie', name: 'Película o Serie', icon: '🎬', placeholder: 'Ej: Coco, Chernobyl, Batman...', description: 'Cine, streaming o televisión', validationType: 'subjective' },
  { id: 'cantante_banda', name: 'Cantante o Banda', icon: '🎤', placeholder: 'Ej: Coldplay, Chayanne, Dua Lipa...', description: 'Músico solista o grupo musical', validationType: 'subjective' },
  { id: 'marca_empresa', name: 'Marca o Empresa', icon: '🏢', placeholder: 'Ej: Coca Cola, Canon, Apple...', description: 'Marcas famosas o multinacionales', validationType: 'subjective' },
  { id: 'personaje_ficticio', name: 'Personaje o Superhéroe', icon: '🦸', placeholder: 'Ej: Capitán América, Cenicienta...', description: 'Héroe, villano o animación', validationType: 'subjective' },
  { id: 'comida_postre', name: 'Comida o Postre', icon: '🍔', placeholder: 'Ej: Crepa, Chocolate, Hamburguesa...', description: 'Plato, snack o postre internacional', validationType: 'subjective' },
  { id: 'videojuego_app', name: 'Videojuego o App', icon: '🎮', placeholder: 'Ej: Clash Royale, Candy Crush, Spotify...', description: 'Juegos de consola/PC o apps populares', validationType: 'subjective' },
];

export const CRAZY_CATEGORIES: Category[] = [
  { id: 'excusa_tarde', name: 'Excusa para llegar tarde', icon: '⏰', placeholder: 'Ej: Cayó un diluvio inesperado...', description: 'La típica excusa divertida', validationType: 'subjective' },
  { id: 'superpoder_inutil', name: 'Superpoder inútil', icon: '🦸', placeholder: 'Ej: Convertir agua en caldo tibio...', description: 'Un superpoder ridículo e innecesario', validationType: 'subjective' },
  { id: 'famoso_meme', name: 'Famoso o Meme viral', icon: '🎭', placeholder: 'Ej: Chayanne, Chespirito, Ibai...', description: 'Personaje viral o celebridad', validationType: 'subjective' },
  { id: 'miedo_extrano', name: 'Miedo o fobia extraña', icon: '😱', placeholder: 'Ej: Cucarachas voladoras...', description: 'Fobias o miedos insólitos', validationType: 'subjective' },
  { id: 'cancion_inventada', name: 'Título de canción inventada', icon: '🎸', placeholder: 'Ej: Corazones Congelados...', description: 'Nombre creativo para una canción', validationType: 'subjective' },
  { id: 'frase_jefe', name: 'Frase de profesor o jefe', icon: '💬', placeholder: 'Ej: Cierren los cuadernos...', description: 'Frase clásica de autoridad', validationType: 'subjective' },
];

export const IRL_OBJECTS_CATEGORIES: Category[] = [
  { id: 'objeto_escritorio', name: 'Objeto a 1 metro de ti', icon: '🪑', placeholder: 'Ej: Cable, Celular, Cuaderno...', description: 'Mira a tu alrededor en este instante', validationType: 'subjective' },
  { id: 'prenda_puesta', name: 'Prenda o accesorio que llevas', icon: '👕', placeholder: 'Ej: Camiseta, Cinturón, Collar...', description: 'Ropa o accesorio que tienes puesto', validationType: 'subjective' },
  { id: 'algo_bolsillo', name: 'Algo que cabe en tu bolsillo', icon: '🪙', placeholder: 'Ej: Canica, Caramelo, Moneda...', description: 'Objetos pequeños y portátiles', validationType: 'subjective' },
  { id: 'cosa_cocina_refri', name: 'Cosa en la cocina o despensa', icon: '🧊', placeholder: 'Ej: Cuchillo, Café, Crema...', description: 'Ingrediente, plato o utensilio', validationType: 'subjective' },
  { id: 'objeto_material', name: 'Objeto de plástico o madera', icon: '🪵', placeholder: 'Ej: Cepillo, Caja, Cuchara...', description: 'Objeto hecho de ese material', validationType: 'subjective' },
  { id: 'sonido_accion', name: 'Sonido o acción física', icon: '🔊', placeholder: 'Ej: Cantar, Correr, Chasquear...', description: 'Acción que puedes imitar', validationType: 'subjective' },
];

export const ALL_PRESET_MODES: Record<GameMode, { title: string; subtitle: string; icon: string; categories: Category[] }> = {
  classic: {
    title: 'Clásico Internacional',
    subtitle: 'Nombre, Apellido, País/Ciudad, Animal, Fruta/Verdura, Objeto y Color.',
    icon: '🏆',
    categories: CLASSIC_CATEGORIES,
  },
  pop_culture: {
    title: 'Cultura Pop & Entretenimiento',
    subtitle: 'Películas, series, cantantes, marcas mundiales, superhéroes y apps.',
    icon: '🎬',
    categories: POP_CULTURE_CATEGORIES,
  },
  crazy: {
    title: 'Modo Fiesta & Risas',
    subtitle: 'Categorías cómicas, excusas locas, memes y superpoderes inútiles.',
    icon: '🤪',
    categories: CRAZY_CATEGORIES,
  },
  irl_objects: {
    title: 'Objetos Reales (IRL)',
    subtitle: 'Cosas a tu alrededor, ropa que llevas y objetos cotidianos.',
    icon: '👀',
    categories: IRL_OBJECTS_CATEGORIES,
  },
  custom: {
    title: 'Personalizado',
    subtitle: 'Elige tus propias categorías y diseña la partida a tu gusto.',
    icon: '⚙️',
    categories: CLASSIC_CATEGORIES,
  },
};

export const ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 
  'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'Y', 'Z'
];

export const AVATAR_OPTIONS = [
  '👑', '🚀', '⭐', '🦁', '⚡', '🔥', '🎮', '🍕', '🎸', '⚽', 
  '🥑', '🎩', '🐆', '🦅', '🍌', '💎', '🦖', '🐢', '🏆', '🎯'
];

export const GAME_QUICK_SHOUTS = [
  { text: '¡CHANTINCHANTÓN!', type: 'chantin', icon: '📢' },
  { text: '¡STOP / TIEMPO!', type: 'paralo', icon: '🛑' },
  { text: '¡Esa palabra no vale!', type: 'novale', icon: '❌' },
  { text: '¡Apúrate que se acaba!', type: 'pilas', icon: '⚡' },
  { text: '¡Te la inventaste!', type: 'novale', icon: '🤥' },
  { text: '¡Excelente palabra!', type: 'general', icon: '👏' },
  { text: '¡A votar todos!', type: 'general', icon: '⚖️' },
  { text: '¡Gané esta ronda!', type: 'general', icon: '🏆' },
];

export const ECUADOR_QUICK_SHOUTS = GAME_QUICK_SHOUTS;
