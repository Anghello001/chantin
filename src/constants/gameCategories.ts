import { Category, GameMode } from '../types/game';

export const CLASSIC_CATEGORIES: Category[] = [
  { id: 'nombre', name: 'Nombre', icon: '👤', placeholder: 'Ej: Carlos, Camila...', validationType: 'subjective' },
  { id: 'apellido', name: 'Apellido', icon: '🏷️', placeholder: 'Ej: Castillo, Castro...', validationType: 'subjective' },
  { id: 'ciudad_pais', name: 'Ciudad o País', icon: '🌍', placeholder: 'Ej: Cuenca, Colombia...', validationType: 'subjective' },
  { id: 'fruta_verdura', name: 'Fruta / Verdura', icon: '🍎', placeholder: 'Ej: Cereza, Coco...', validationType: 'dictionary' },
  { id: 'cosa', name: 'Cosa / Objeto', icon: '📦', placeholder: 'Ej: Cuchara, Cuaderno...', validationType: 'dictionary' },
  { id: 'color', name: 'Color', icon: '🎨', placeholder: 'Ej: Celeste, Café...', validationType: 'dictionary' },
  { id: 'animal', name: 'Animal', icon: '🦁', placeholder: 'Ej: Conejo, Camaleón...', validationType: 'dictionary' },
];

export const CRAZY_CATEGORIES: Category[] = [
  { id: 'excusa_tarde', name: 'Excusa para llegar tarde', icon: '⏰', placeholder: 'Ej: Cayó tremendo aguacero...', description: 'La típica excusa que le dices a tu jefe o profe', validationType: 'subjective' },
  { id: 'insulto_abuelita', name: 'Frase o regaño de mamá/abuela', icon: '👵', placeholder: 'Ej: Come o te chancleteo...', description: 'Dicho o amenaza clásica familiar', validationType: 'subjective' },
  { id: 'superpoder_inutil', name: 'Superpoder inútil', icon: '🦸', placeholder: 'Ej: Convertir agua en caldo tibio...', description: 'Un superpoder ridículo que a nadie le sirve', validationType: 'subjective' },
  { id: 'nombre_banda', name: 'Nombre de banda de rock / chicha', icon: '🎸', placeholder: 'Ej: Cervezas Calientes...', description: 'Grupo musical imaginario o real', validationType: 'subjective' },
  { id: 'comida_callejera', name: 'Comida callejera o bajón', icon: '🌮', placeholder: 'Ej: Chuzos con mote...', description: 'Manjar de esquina a las 2 AM', validationType: 'subjective' },
  { id: 'miedo_extrano', name: 'Miedo irracional o fobia', icon: '😱', placeholder: 'Ej: Cucarachas voladoras...', description: 'Cosas que te quitan el sueño', validationType: 'subjective' },
  { id: 'personaje_meme', name: 'Famoso, meme o influencer', icon: '🎭', placeholder: 'Ej: Chayanne, Chespirito...', description: 'Personaje viral o famoso de TV', validationType: 'subjective' },
];

export const IRL_OBJECTS_CATEGORIES: Category[] = [
  { id: 'objeto_escritorio', name: 'Objeto a 1 metro de ti', icon: '🪑', placeholder: 'Ej: Cable, Celular...', description: 'Mira a tu alrededor en este instante', validationType: 'subjective' },
  { id: 'prenda_puesta', name: 'Prenda o accesorio que llevas', icon: '👕', placeholder: 'Ej: Camiseta, Cinturón...', description: 'Ropa o accesorio que tienes puesto ahora', validationType: 'subjective' },
  { id: 'algo_bolsillo', name: 'Algo que cabe en tu bolsillo', icon: '🪙', placeholder: 'Ej: Canica, Caramelo...', description: 'Cosas diminutas o portátiles', validationType: 'subjective' },
  { id: 'cosa_cocina_refri', name: 'Cosa en tu refrigerador / cocina', icon: '🧊', placeholder: 'Ej: Cilantro, Crema...', description: 'Ingrediente, plato o utensilio de cocina', validationType: 'subjective' },
  { id: 'objeto_material', name: 'Objeto de plástico o madera', icon: '🪵', placeholder: 'Ej: Cuchara de palo...', description: 'Objeto hecho de ese material', validationType: 'subjective' },
  { id: 'sonido_accion', name: 'Sonido o acción que puedes hacer', icon: '🔊', placeholder: 'Ej: Cantar, Chasquear...', description: 'Acción que puedes imitar en vivo', validationType: 'subjective' },
];

export const ECUADOR_CATEGORIES: Category[] = [
  { id: 'plato_tipico', name: 'Comida típica ecuatoriana', icon: '🍲', placeholder: 'Ej: Ceviche, Caldo de bolas...', validationType: 'subjective' },
  { id: 'jerga_ecuatoriana', name: 'Jerga / Palabra ecuatoriana', icon: '🇪🇨', placeholder: 'Ej: Chapa, Chulla, Chévere...', validationType: 'subjective' },
  { id: 'ciudad_canton', name: 'Ciudad, Cantón o Barrio ecuatoriano', icon: '🏙️', placeholder: 'Ej: Cayambe, Carapungo...', validationType: 'subjective' },
  { id: 'apodo_chapa', name: 'Apodo / Chapa popular', icon: '🧢', placeholder: 'Ej: Chino, Colorado, Chato...', validationType: 'subjective' },
  { id: 'dulce_golosina', name: 'Dulce o golosina típica', icon: '🍬', placeholder: 'Ej: Chocolatina Manicho, Chicle...', validationType: 'subjective' },
  { id: 'farra_musica', name: 'Cosa de farra o fiesta ecuatoriana', icon: '🎉', placeholder: 'Ej: Canelazo, Cumbia...', validationType: 'subjective' },
];

export const ALL_PRESET_MODES: Record<GameMode, { title: string; subtitle: string; icon: string; categories: Category[] }> = {
  classic: {
    title: 'Tradicional Ecuatoriano',
    subtitle: 'Nombres, Apellidos y Ciudades con Votación; Cosas, Frutas, Colores y Animales con Diccionario.',
    icon: '🏆',
    categories: CLASSIC_CATEGORIES,
  },
  crazy: {
    title: 'Modo Locura / Party',
    subtitle: 'Categorías cómicas, excusas, regaños y superpoderes con filtro de votación.',
    icon: '🤪',
    categories: CRAZY_CATEGORIES,
  },
  irl_objects: {
    title: 'Objetos en la Vida Real (IRL)',
    subtitle: 'Cosas que tienes cerca con aprobación democrática de los jugadores.',
    icon: '👀',
    categories: IRL_OBJECTS_CATEGORIES,
  },
  ecuador: {
    title: '100% Criollo Ecuatoriano',
    subtitle: 'Jergas, platos típicos, apodos, cantones y canelazo.',
    icon: '🇪🇨',
    categories: ECUADOR_CATEGORIES,
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
  '🦙', '🐆', '🦅', '🍌', '🌽', '🎸', '⚽', '🌶️', '🥑', '🎩', 
  '👑', '🔥', '⚡', '🦜', '🦀', '🦁', '🚀', '⭐', '🦖', '🐢'
];

export const ECUADOR_QUICK_SHOUTS = [
  { text: '¡CHANTINCHANTÓN!', type: 'chantin', icon: '📢' },
  { text: '¡PÁRALO LOCO!', type: 'paralo', icon: '🛑' },
  { text: '¡Esa palabra no vale!', type: 'novale', icon: '❌' },
  { text: '¡Pilas que se acaba!', type: 'pilas', icon: '⚡' },
  { text: '¡Habla serio ve!', type: 'general', icon: '🤨' },
  { text: '¡Te la inventaste!', type: 'novale', icon: '🤥' },
  { text: '¡Qué buena palabra!', type: 'general', icon: '👏' },
];
