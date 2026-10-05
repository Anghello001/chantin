import dictionaryWords from '../data/palabras_espanol.json';

// Normalize string: lowercase, trim, remove accents/diacritics
export function normalizeSpanish(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[^a-z0-9ñ ]/g, '') // keep basic letters and ñ
    .replace(/\s+/g, ' ');
}

export function wordStartsWithLetter(word: string, letter: string): boolean {
  if (!word || !letter) return false;
  const cleanWord = normalizeSpanish(word);
  const cleanLetter = normalizeSpanish(letter);
  return cleanWord.startsWith(cleanLetter);
}

// Master In-RAM Dictionaries
export const GENERAL_WORDS_SET = new Set<string>();
export const NOMBRES_SET = new Set<string>();
export const APELLIDOS_SET = new Set<string>();
export const CIUDADES_PAISES_SET = new Set<string>();
export const COLORES_SET = new Set<string>();
export const ANIMALES_SET = new Set<string>();
export const FRUTAS_VERDURAS_SET = new Set<string>();

// Preload words from JSON into RAM
for (const w of dictionaryWords) {
  const norm = normalizeSpanish(w);
  if (norm.length > 0) {
    GENERAL_WORDS_SET.add(norm);
  }
}

// Curated List of Real Spanish & Latin Names
const NOMBRES_LIST = [
  "abigail", "abraham", "ada", "adan", "adela", "adelaida", "adolfo", "adrian", "adriana", "agatha", "agustin", "agustina",
  "aida", "alan", "alberto", "alejandra", "alejandro", "alex", "alexander", "alexandra", "alfonso", "alfredo", "alicia", "alma", "alondra", "alvaro", "amadeo", "amalia", "amanda", "amelia", "ana", "anabel", "anahi", "anastasia", "andrea", "andres", "angel", "angela", "angelica", "antonio", "antonia", "apolinar", "ariadna", "ariel", "armando", "arturo", "astrid", "augusto", "aurea", "aurelio", "aurora", "axel",
  "barbara", "bartolome", "beatriz", "belen", "benedicto", "benigno", "benito", "benjamin", "bernardo", "berta", "bianca", "blanca", "boris", "braulio", "brenda", "bruno", "bryan",
  "camila", "camilo", "candela", "caridad", "carina", "carla", "carlos", "carmelo", "carmen", "carolina", "casandra", "casimiro", "catalina", "cecilia", "ceferino", "celeste", "celia", "celina", "cesar", "charles", "christian", "cindy", "clara", "clarisa", "claudia", "claudio", "clemente", "cleopatra", "clotilde", "concepcion", "conrado", "constanza", "consuelo", "cora", "cordelia", "corina", "cornelio", "cosme", "crisanto", "cristian", "cristina", "cristobal", "cruz",
  "daiana", "dalila", "damian", "damián", "dante", "daniela", "daniel", "dario", "david", "debora", "delia", "delmira", "demetrio", "denis", "denise", "derek", "diana", "diego", "dina", "dino", "dionisio", "dora", "doris", "dorotea", "dulce",
  "edgar", "edgardo", "edith", "edmar", "edmundo", "eduardo", "eduarda", "edwin", "efrain", "efren", "elba", "elena", "eleazar", "elias", "eliel", "elisa", "elisabeth", "elizabeth", "eloy", "elva", "elvia", "elvis", "emanuel", "emerson", "emilia", "emiliano", "emilio", "emma", "enoc", "enrique", "enriqueta", "erasto", "eric", "erick", "erika", "ernesto", "esmeralda", "esperanza", "esteban", "estefania", "estela", "esther", "estrella", "eufemia", "eugenio", "eugenia", "eulalia", "eusebio", "eva", "evangelina", "evelyn", "everardo", "ezequiel",
  "fabian", "fabiana", "fabiola", "fabricio", "facundo", "fatima", "fausto", "faustino", "federico", "felipe", "felicia", "felicidad", "felicitas", "felix", "fermin", "fernanda", "fernando", "fidel", "fiona", "flavio", "flora", "florencia", "florentino", "fortuna", "francia", "francisca", "francisco", "franco", "franklin", "freddy", "fredy",
  "gabriel", "gabriela", "gael", "gaston", "gaspar", "gemma", "genaro", "genesis", "genoveva", "george", "georgina", "geraldine", "gerardo", "german", "gertrudis", "gisela", "gisselle", "gladys", "gloria", "gonzalo", "gracia", "graciela", "gregorio", "guadalupe", "guido", "guillermina", "guillermo", "gustavo",
  "harold", "haydee", "hector", "heidi", "helena", "helio", "henry", "heriberto", "hernan", "hilda", "hilario", "hipolito", "homero", "honorato", "horacio", "hortensia", "hugo", "humberto",
  "ian", "ibrahim", "ignacio", "igor", "iliana", "imelda", "ines", "ingrid", "inigo", "inmaculada", "iraida", "irene", "iris", "irma", "isaac", "isabel", "isabella", "isaias", "isidoro", "isidro", "ismael", "isolda", "israel", "italo", "ivan", "ivana", "ivon", "ivonne", "iza",
  "jacinto", "jacobo", "jacqueline", "jaime", "jairo", "jair", "james", "janet", "janeth", "javier", "jayden", "jean", "jeannette", "jefferson", "jenny", "jennifer", "jeremias", "jessica", "jesus", "jhon", "jhony", "jimena", "joan", "joaquin", "joel", "johana", "jonas", "jonathan", "jorge", "jose", "josefa", "josefina", "joselin", "joselito", "joshua", "josue", "juan", "juana", "juanita", "judith", "julia", "julian", "juliana", "julio", "junior", "justino", "justo",
  "karen", "karina", "karla", "katia", "kevin", "kimberly", "klaus",
  "laura", "lautaro", "lazaro", "leandro", "leila", "leo", "leon", "leonardo", "leonel", "leonor", "leopoldo", "leticia", "lia", "lidia", "ligia", "lina", "lissette", "livia", "lorena", "lorenzo", "lourdes", "lucas", "lucia", "luciano", "lucrecia", "luis", "luisa", "luz",
  "macarena", "magali", "magdalena", "maite", "manuel", "manuela", "marcela", "marcelo", "marcial", "marco", "marcos", "margarita", "maria", "mariana", "maribel", "marina", "mario", "marisol", "marta", "martin", "mateo", "matias", "mauricio", "mauro", "maximiliano", "maximo", "mayra", "melanie", "melina", "melisa", "mercedes", "micaela", "michel", "miguel", "milagros", "milena", "milo", "miriam", "mirta", "moises", "monica",
  "nadia", "nahuel", "nancy", "naomi", "natalia", "natalio", "natanael", "nathan", "nazareno", "nestor", "nicolas", "nicole", "nidia", "nina", "noah", "noe", "noemi", "nora", "norberto", "norma", "nuria",
  "octavio", "olga", "oliver", "olivia", "omar", "oriana", "orlando", "oscar", "osvaldo", "otilia", "otto",
  "pablo", "paco", "paloma", "paola", "pascal", "patricia", "patricio", "paula", "paulina", "pedro", "penelope", "pepe", "pilar", "placido", "pol", "polo", "priscila",
  "rafael", "rafaela", "ramiro", "ramon", "raquel", "raul", "rebeca", "regina", "reinaldo", "renee", "renato", "rene", "ricardo", "rita", "roberto", "rocio", "rodrigo", "rogelio", "rojas", "rolando", "roman", "romina", "ronald", "rosa", "rosalia", "rosana", "rosario", "roxana", "ruben", "ruperto", "ruth",
  "sabrina", "salome", "salvador", "samanta", "samuel", "sandra", "santiago", "santo", "sara", "saul", "sebastian", "selena", "sergio", "silvano", "silvia", "simon", "simona", "socorro", "sofia", "sol", "soledad", "sonia", "stefano", "susana",
  "tadeo", "talia", "tamara", "tania", "tatiana", "telma", "teodoro", "teresa", "tiago", "tomas", "trinidad", "tristan",
  "ulises", "ursula",
  "valentin", "valentina", "valeria", "valerio", "valery", "vanesa", "vera", "veronica", "vicente", "victor", "victoria", "vidal", "vilma", "vinicio", "violeta", "virginia", "vladimir",
  "walter", "washington", "wenceslao", "wilfredo", "william", "williams", "wilmer", "wilson",
  "xavier", "ximena", "xiomara",
  "yago", "yamila", "yanina", "yasmin", "yazmin", "yesenia", "yessica", "yoel", "yolanda", "yuri",
  "zacarias", "zaida", "zamira", "zeus", "zoe"
];

// Curated List of Real Surnames
const APELLIDOS_LIST = [
  "abril", "acosta", "acuna", "adams", "aguilar", "aguilera", "aguirre", "alaimo", "alarcon", "alava", "alban", "albuja", "alcivar", "alcocer", "aldana", "aleman", "alfaro", "almeida", "almonte", "alonso", "alvarado", "alvarez", "alvear", "alzate", "amador", "amores", "anchundia", "andino", "andrade", "angeles", "angoma", "angosto", "aparicio", "aponte", "aragon", "arango", "araujo", "arboleda", "arce", "archundia", "arcila", "arcos", "arellano", "arevalo", "argudo", "arguello", "arias", "armas", "armendariz", "armas", "armijos", "arosemena", "arteaga", "astudillo", "avila", "aviles", "ayala", "azanza",
  "baca", "baena", "baez", "balarezo", "balcazar", "balda", "baldeon", "ballesteros", "baquerizo", "barahona", "barba", "barberan", "barboza", "barco", "baron", "barragan", "barranco", "barre", "barreiro", "barreno", "barrera", "barreto", "barriga", "barrio", "barrionuevo", "barrios", "barros", "bastidas", "batallas", "bautista", "bayer", "bayas", "baza", "becerra", "bedoya", "bejarano", "belalcazar", "beltran", "benalcazar", "benavides", "benitez", "bermeo", "bernal", "berrocal", "berruz", "betancourt", "betancur", "blacio", "blanco", "boada", "bolanos", "bonifaz", "bonilla", "borbua", "borja", "borrero", "bosco", "botero", "bracho", "braganza", "bravo", "briceno", "brito", "brizuela", "buchelli", "bueno", "burbano", "burgos", "bustamante", "bustos",
  "caballero", "cabanillas", "cabello", "cabeza", "cabezas", "cabot", "cabrera", "cacicedo", "caceres", "cadena", "caicedo", "caisatoa", "calahorrano", "calderon", "calero", "calisto", "calle", "callejas", "calva", "calvache", "camacho", "camara", "camino", "campana", "campoverde", "campos", "canales", "canarte", "canizares", "cano", "cantu", "cantuna", "capelo", "capuz", "carabali", "caraballo", "carbo", "carcelen", "cardenas", "cardona", "cardoso", "careaga", "carias", "carmona", "carranza", "carrasco", "carrera", "carrero", "carrillo", "carrion", "carvajal", "casal", "casanova", "casares", "casas", "casco", "castaneda", "castaneda", "castaneda", "castaneda", "castanier", "castaneda", "castillo", "castrillon", "castro", "catani", "cattani", "cazar", "ceballos", "cedeno", "cegarra", "cepeda", "cerda", "ceron", "cervantes", "cerna", "cervantes", "cevallos", "chacon", "chala", "chamba", "chang", "chango", "chao", "charpentier", "chasi", "chauca", "chavez", "chavez", "chavez", "checa", "chicango", "chico", "chiliquinga", "chiluisa", "chin", "chiriboga", "choto", "chuma", "chumana", "churuchumbi", "cisneros", "clavijo", "cobos", "coello", "collaguazo", "collantes", "coloma", "colon", "concha", "condo", "condor", "constantine", "contreras", "cordero", "cordova", "cornejo", "coro", "coronel", "corral", "corrales", "correa", "cortez", "costa", "costales", "coto", "cova", "crespo", "criollo", "cruz", "cuadros", "cuellar", "cuenca", "cuero", "cuervas", "cueva", "cuevas", "curi", "custodio",
  "davalos", "davila", "de la cruz", "de la rosa", "de la torre", "del pozo", "del rio", "del salto", "del valle", "delgado", "diaz", "diez", "dillon", "dominguez", "donoso", "duenas", "duque", "duran",
  "echeverria", "eguez", "elizalde", "encalada", "endara", "enriquez", "erazo", "escalante", "escobar", "escudero", "espana", "esparza", "espin", "espinal", "espinel", "espinosa", "espinoza", "estrada", "estrella",
  "fajardo", "falcon", "falquez", "farias", "febres", "fernandez", "ferre", "ferreira", "ferrer", "fierro", "figueroa", "fiallos", "flores", "florez", "fonseca", "franco", "freire", "fuentes",
  "gaibor", "gaitan", "galarza", "galeno", "galindo", "gallardo", "gallego", "gallegos", "gallo", "galvez", "gamboa", "garces", "garcia", "garces", "garzon", "gavilanez", "gavilanes", "gil", "giraldo", "giron", "godoy", "gomez", "gonzalez", "gordillo", "granja", "grijalva", "guachamin", "guallasamin", "guaman", "guarderas", "guerra", "guerrero", "guevara", "guillen", "gutierrez", "guzman",
  "haro", "henriquez", "herdoiza", "heredia", "hermida", "hernandez", "herrera", "hidalgo", "hinojosa", "holguin", "huerta", "hurtado",
  "ibanez", "ibarra", "iglesias", "illescas", "infante", "iriarte", "izquierdo", "izurieta",
  "jacome", "jaen", "jaime", "jara", "jaramillo", "jaso", "jativa", "jauregui", "jerez", "jimenez", "jordan", "juarez", "jurado",
  "labrador", "lacruz", "lagos", "lamas", "lara", "larrea", "lasso", "lastra", "latorre", "lavayen", "lazo", "lecaro", "ledesma", "legarda", "lema", "leon", "lerma", "leyva", "lima", "limongi", "linzan", "lira", "lizano", "llano", "llanos", "llerenas", "loaiza", "loayza", "lobo", "loja", "londono", "lopez", "lora", "lorduy", "loza", "lozano", "lucas", "lucero", "luis", "luna", "luque",
  "macas", "machado", "macias", "madera", "madrigal", "mafla", "maidana", "maldonado", "manchay", "mancero", "mancilla", "manotas", "manrique", "mantilla", "manzano", "maranon", "marcelo", "marchena", "marin", "marquez", "marroquin", "martillo", "martinez", "mata", "mateo", "matos", "matovelle", "maza", "mazacon", "medina", "medranda", "medrano", "mejia", "melendez", "melo", "mena", "mendez", "mendoza", "menendez", "merchan", "merino", "mero", "mesa", "mestanza", "mier", "miguez", "milan", "minda", "mino", "miranda", "mireles", "mita", "molina", "molineros", "moncayo", "monge", "montalvo", "montalvan", "montano", "montenegro", "montero", "montes", "montesdeoca", "montiel", "montoya", "mora", "morales", "moran", "moreano", "moreira", "morejon", "moreno", "morillo", "morocho", "moscoso", "mosquera", "moya", "mueckay", "muniz", "munoz", "murillo", "muro",
  "naranjo", "narvaez", "navarrete", "navarro", "navas", "neira", "nieto", "nivea", "noboa", "nogales", "noriega", "novillo", "nunez",
  "ochoa", "ojeda", "olalla", "olave", "oliva", "olivares", "olivera", "oliveros", "olivo", "olmedo", "ondarza", "ordonez", "orellana", "orozco", "ortega", "ortiz", "osorio", "ospina", "ovalle", "oviedo",
  "pacheco", "padilla", "paez", "palacios", "paladines", "palma", "palomeque", "panchi", "pantoja", "paredes", "pareja", "paris", "parra", "parreno", "pasquel", "paspuel", "pasto", "pastor", "patino", "paucar", "paz", "pazmino", "pedraza", "pedroza", "pelayo", "pena", "penafiel", "penarreta", "penaranda", "penarreta", "peralta", "perdomo", "perea", "pereira", "perez", "pesantez", "pescor", "picuasi", "piedra", "pila", "pilamunga", "pillajo", "pimentel", "pina", "pinargote", "pincay", "pineda", "pinela", "pino", "pinto", "pinzon", "piqueras", "pita", "pizarro", "plata", "plaza", "poma", "pomar", "ponce", "ponceano", "pontigo", "portilla", "portocarrero", "posada", "posso", "poveda", "pozo", "prado", "prat", "prieto", "proano", "puente", "puertas", "puga", "pulgar", "pulido",
  "quebrada", "quesada", "quezada", "quijano", "quinde", "quinones", "quintana", "quintanilla", "quintero", "quinteros", "quinto", "quiroz", "quiroga", "quispe",
  "radovich", "ramirez", "ramon", "ramos", "rangel", "recalde", "redin", "reina", "reinoso", "rendon", "requena", "restrepo", "revelo", "reyes", "rey", "reynaldo", "reynoso", "ribera", "ribadeneira", "ricaurte", "rico", "riego", "riera", "riga", "rincon", "rios", "rivadeneira", "rivas", "rivera", "rivero", "robalino", "robles", "robledo", "roca", "rocafuerte", "rocha", "rodriguez", "rojas", "rojo", "roldan", "roman", "romero", "romo", "ron", "ronquillo", "rosales", "rosas", "rosero", "rossi", "roura", "rovalino", "rubio", "rueda", "ruilova", "ruiz",
  "saavedra", "sabando", "sacoto", "saenz", "sagasti", "sagbay", "salamea", "salas", "salazar", "salcedo", "saldaña", "saldivar", "salgado", "salinas", "salitre", "salmeron", "salomon", "salto", "saltos", "salvador", "salvatierra", "samper", "san martin", "sanchez", "sancho", "sandoval", "sangurima", "sanjinez", "santacruz", "santamaria", "santana", "santander", "santiago", "santillan", "santistevan", "santos", "sanz", "sarango", "sarmiento", "saucedo", "segovia", "segura", "sema", "senlle", "serna", "serrano", "servin", "sevilla", "sierra", "silva", "simbana", "sinche", "sisalima", "sobarzo", "soberon", "solano", "soler", "solis", "solorzano", "soma", "soria", "soriano", "sosa", "sotelo", "soto", "sotomayor", "suarez", "suasnavas", "sucre",
  "tabares", "taboada", "taco", "taiwa", "tamayo", "tandazo", "tanguila", "tapia", "tarragona", "tejada", "tejedor", "tello", "tenecela", "tenorio", "teran", "tigre", "tinajero", "tinoco", "tipan", "tituana", "tobar", "toala", "toaquiza", "toasa", "tocagon", "toledo", "tomala", "toral", "torres", "torrico", "toscano", "tovares", "traverso", "trejo", "troya", "trujillo", "tufino",
  "ubidia", "ugalde", "ugsha", "ulloa", "urdaneta", "urdiales", "uribe", "urresta", "urruria", "urrutia",
  "vaca", "vadillo", "valarezo", "valcarcel", "valderrama", "valdes", "valdez", "valdivia", "valdivieso", "valencia", "valenzuela", "valiente", "valle", "vallejo", "vallesteros", "valverde", "vanegas", "varela", "vargas", "vasconez", "vasquez", "veintimilla", "vega", "vela", "velasco", "velasquez", "velez", "veloz", "venegas", "vera", "verdezoto", "vergara", "vergel", "vicente", "vicuna", "vidal", "vidales", "viera", "vilela", "villa", "villacres", "villacis", "villafuerte", "villalobos", "villalba", "villalta", "villamar", "villamizar", "villanueva", "villarreal", "villavicencio", "villegas", "vinces", "vinueza", "viscarra", "viteri", "vivanco", "vivero", "viveros",
  "yanez", "yandun", "yepez", "yugcha", "yumbo",
  "zaldumbide", "zambrano", "zamora", "zapata", "zaruma", "zavala", "zea", "zerda", "zevallos", "zorrilla", "zuniga", "zurita"
];

// Curated List of Cities & Countries
const CIUDADES_PAISES_LIST = [
  "ecuador", "quito", "guayaquil", "cuenca", "ambato", "manta", "portoviejo", "loja", "machala", "esmeraldas", "ibarra", "quevedo", "babahoyo", "milagro", "riobamba", "latacunga", "tulcan", "guaranda", "azogues", "pasaje", "santa elena", "salinas", "otavalo", "cayambe", "cotacachi", "banos", "puyo", "tena", "macas", "zamora", "nueva loja", "lago agrio", "el carmen", "daulle", "samborondon", "duran", "montecristi", "bahia", "pedernales", "chone", "huaquillas", "catamayo", "girón", "gualaceo", "paute", "santa rosa", "arenillas", "zaruma", "pina", "ventanas", "vinces", "balzar", "empalme", "naranjal", "naranjito", "yaguachi", "playas",
  "colombia", "bogota", "medellin", "cali", "barranquilla", "cartagena", "bucaramanga", "pereira", "manizales", "pasto", "cucuta", "ibague", "santa marta", "villavicencio", "armenia", "popayan", "neiva", "valledupar", "monteria", "sincelejo", "tunja", "riohacha",
  "peru", "lima", "arequipa", "trujillo", "chiclayo", "piura", "iquitos", "cusco", "cuzco", "chimbote", "huancayo", "tacna", "ica", "juliaca", "pucallpa", "sullana", "ayacucho", "cajamarca", "huanuco", "tumbes",
  "chile", "santiago", "valparaiso", "concepcion", "la serena", "antofagasta", "temuco", "rancagua", "talca", "arica", "chillan", "iquique", "puerto montt", "punta arenas",
  "argentina", "buenos aires", "cordoba", "rosario", "mendoza", "tucuman", "la plata", "mar del plata", "salta", "santa fe", "san juan", "resistencia", "neuquen", "bariloche", "ushuaia",
  "brasil", "brazil", "brasilia", "sao paulo", "rio de janeiro", "salvador", "fortaleza", "belo horizonte", "manaus", "curitiba", "recife", "porto alegre",
  "bolivia", "la paz", "santa cruz", "cochabamba", "sucre", "oruro", "potosi", "tarija", "trinidad", "cobija",
  "venezuela", "caracas", "maracaibo", "valencia", "barquisimeto", "maracay", "ciudad guayana", "san cristobal", "maturin", "cumana", "merida",
  "uruguay", "montevideo", "punta del este", "salto", "paysandu", "maldonado",
  "paraguay", "asuncion", "ciudad del este", "encarnacion", "luque", "san lorenzo",
  "mexico", "ciudad de mexico", "guadalajara", "monterrey", "puebla", "tijuana", "leon", "juarez", "cancun", "merida", "acapulco", "veracruz", "oaxaca", "queretaro", "toluca", "chihuahua", "saltillo", "aguascalientes", "hermosillo", "san luis potosi",
  "espana", "spain", "madrid", "barcelona", "valencia", "sevilla", "zaragoza", "malaga", "murcia", "palma", "bilbao", "alicante", "cordoba", "valladolid", "vigo", "gijon", "granada", "oviedo", "cadiz", "toledo", "salamanca", "pamplona", "santander", "san sebastian",
  "estados unidos", "usa", "washington", "nueva york", "new york", "los angeles", "chicago", "houston", "miami", "orlando", "san francisco", "dallas", "boston", "las vegas", "seattle", "atlanta", "denver",
  "canada", "ottawa", "toronto", "montreal", "vancouver", "calgary", "quebec",
  "alemania", "berlin", "munich", "hamburgo", "frankfurt", "colonia", "stuttgart",
  "francia", "paris", "marsella", "lyon", "toulouse", "niza", "nantes", "burdeos",
  "italia", "roma", "milan", "napoles", "turin", "florencia", "venecia", "bolonia",
  "reino unido", "inglaterra", "londres", "manchester", "liverpool", "edimburgo", "birmingham",
  "rusia", "moscu", "san petersburgo", "kazan",
  "china", "beijing", "pekin", "shanghai", "canton", "shenzhen", "wuhan",
  "japon", "tokio", "osaka", "kioto", "yokohama", "nagoya", "sapporo",
  "australia", "canberra", "sidney", "melbourne", "brisbane", "perth",
  "panama", "costa rica", "san jose", "guatemala", "honduras", "tegucigalpa", "el salvador", "san salvador", "nicaragua", "managua",
  "cuba", "la habana", "republica dominicana", "santo domingo", "puerto rico", "san juan", "jamaica", "kingston", "haiti", "puerto principe"
];

// Curated List of Colors
const COLORES_LIST = [
  "amarillo", "azul", "rojo", "verde", "blanco", "negro", "naranja", "morado", "rosado", "rosa", "gris", "cafe", "marron", "celeste", "turquesa", "violeta", "lila", "magenta", "cian", "dorado", "plateado", "beige", "ocre", "carmesi", "escarlata", "granate", "esmeralda", "zafiro", "ambar", "rubi", "coral", "fucsia", "oliva", "marfil", "lavanda", "salmon", "bronce", "terracota", "caoba", "mostaza", "vino", "azabache", "crema", "purpura", "indigo", "anaranjado", "plata", "oro", "ceniza", "carmin"
];

// Curated List of Animals
const ANIMALES_LIST = [
  "abeja", "abejorro", "aguila", "alacran", "albatros", "alce", "almeja", "alondra", "alpaca", "anaconda", "anguila", "antilope", "arania", "arana", "ardilla", "armadillo", "asno", "atun", "avestruz", "avispa",
  "babosa", "bacalao", "bagre", "ballena", "bisonte", "boa", "bobo", "bonito", "borrego", "buey", "bufalo", "buho", "buitre", "burro",
  "caballo", "cabra", "cabrilla", "caiman", "calamar", "camaleon", "camaron", "camello", "canario", "cangrejo", "canguro", "caracol", "carpa", "cascabel", "castor", "cebra", "cerdo", "chacal", "chigüire", "chimpance", "chinche", "chinchilla", "chivo", "ciervo", "cigarra", "ciguena", "cisne", "coati", "cobra", "cocodrilo", "cojinova", "colibri", "comadreja", "condor", "conejo", "corvina", "coyote", "cucaracha", "cuervo", "cuy",
  "dalmata", "delfin", "demonio de tasmania", "diente de sable", "dinosaurio", "dodo", "doncella", "dragon", "dromedario",
  "elefante", "emu", "erizo", "escarabajo", "escorpion", "esponja", "espurgabuey", "esturion",
  "faisan", "flamenco", "foca", "fragata",
  "gacela", "galapago", "galgo", "gallina", "gallito", "gallo", "gamba", "ganso", "garrapata", "garza", "gato", "gavilán", "gavilan", "gaviota", "geco", "girafa", "golondrina", "gorila", "gorrion", "grillo", "grulla", "guacamayo", "guanaco", "guepardo", "gusano",
  "halcon", "hamster", "hiena", "hipopotamo", "holoturia", "hormiga", "huron",
  "ibis", "iguana", "impala", "insecto palo",
  "jabali", "jaguar", "jilguero", "jirafa",
  "kakapo", "kiwi", "koala", "krill",
  "lagartija", "lagarto", "langosta", "langostino", "lechuza", "lemur", "leopardo", "leon", "leona", "libelula", "liebre", "lince", "llama", "lobo", "loco", "lombris", "lombriz", "loro", "luciernaga", "lucioperca", "ludria", "nutria",
  "macaco", "mamut", "manati", "mandril", "mangosta", "manta", "mantarraya", "mantis", "mapache", "mariposa", "mariquita", "marisco", "marmota", "marsopa", "medusa", "mejillon", "merluza", "mero", "milpiés", "mirlos", "mirlo", "mofeta", "mono", "morsa", "mosca", "mosquito", "mula", "murcielago",
  "nandu", "narval", "neoceratodus", "novillo", "nutria",
  "ocelote", "orca", "oropendola", "oruga", "ornitorrinco", "orix", "oso", "ostra", "otaria", "oveja",
  "pajaro", "paloma", "panda", "pantera", "pato", "pavo", "pelicano", "perdiz", "perico", "perico ligero", "periquito", "perra", "perro", "pescado", "pez", "pez payaso", "pez espada", "picaflor", "pinguino", "piojo", "piraña", "pirana", "piraña", "piton", "pollito", "pollo", "poni", "potro", "puerco", "puercoespín", "pulga", "pulpo", "puma",
  "quebrantahuesos", "quetzal", "quirofano", "quirquincho",
  "rana", "rata", "raton", "raya", "rebeco", "reno", "rinoceronte", "robalo", "ruisenor", "ruiseñor",
  "sabueso", "salamandra", "salmon", "saltamontes", "sanguijuela", "sapo", "sardina", "serpiente", "serval", "simio", "suricata",
  "tapir", "tarantula", "taruca", "tejon", "tiburon", "tigrillo", "tigre", "topo", "toro", "torcaza", "tortuga", "tovilla", "trucha", "tucan",
  "urraca",
  "vaca", "varano", "venado", "vicuna", "vibora", "viscache", "vizcacha",
  "wallaby", "walabi", "wombat",
  "yacare", "yak", "yegua",
  "zancudo", "zebra", "zorro", "zorzal", "zorrillo"
];

// Curated List of Fruits & Vegetables
const FRUTAS_VERDURAS_LIST = [
  "aceituna", "acelga", "achicoria", "achira", "achotillo", "aguacate", "aji", "ajo", "albahaca", "alcachofa", "alcaparra", "alfalfa", "almendra", "albaricoque", "ananá", "anana", "apio", "arandano", "araza", "arveja", "avellana",
  "babaco", "banana", "banano", "batata", "berenjena", "berro", "beterraga", "bilberry", "borojo", "brocoli",
  "cacahuate", "cacao", "cafe", "calabacita", "calabaza", "camote", "canela", "caña", "cantalupo", "caqui", "capuli", "carambola", "castana", "cebolla", "cebollin", "cereza", "champiñon", "chayote", "chirimoya", "chocho", "choclo", "chonta", "ciruela", "coco", "cohombro", "col", "coliflor", "culantro", "curuba",
  "damasco", "datil", "durazno",
  "endivia", "eneldo", "escarola", "esparrago", "espinaca",
  "frambuesa", "fresa", "fresilla", "frijol", "frutilla",
  "garbanzo", "granada", "granadilla", "grosella", "guaba", "guanabana", "guayaba", "guineo", "guisante",
  "habas", "haba", "higo", "hinojo", "hongos", "hongo",
  "islas", "itahuba",
  "jengibre", "jicama", "jojoto",
  "kaki", "kiwi", "kumquat",
  "laurel", "lechuga", "lenteja", "lima", "limon", "lucuma",
  "maiz", "mandarina", "mango", "mani", "manzana", "maracuya", "marrón", "mastic", "melon", "membrillo", "menta", "mora", "moras", "mortino", "mote", "mustard",
  "nabo", "naranja", "naranjilla", "nectarina", "nispero", "nuez",
  "ocumo", "oliva", "oregano",
  "palma", "palmito", "palta", "papa", "papaya", "pasas", "pasa", "pepino", "pepinillo", "pera", "perejil", "pimiento", "pimenton", "pina", "piña", "pistacho", "pitahaya", "platano", "pomelo", "poroto", "puerro",
  "quinoa", "quinua",
  "rabano", "radicchio", "radicheta", "remolacha", "repollo", "romero", "ruibarbo", "rucula",
  "salvia", "sandia", "sauce", "sauco", "semillas", "sesamo", "soja", "soya",
  "tamarindo", "taxo", "tomate", "tomate de arbol", "tomillo", "toronja", "tomatillo", "trigo", "tuna",
  "uchuva", "uva", "uvilla",
  "vainilla", "verdolaga",
  "wasabi",
  "yanten", "yacon", "yuca",
  "zanahoria", "zapallo", "zucchini"
];

// Populate sub-category Sets
for (const item of NOMBRES_LIST) NOMBRES_SET.add(normalizeSpanish(item));
for (const item of APELLIDOS_LIST) APELLIDOS_SET.add(normalizeSpanish(item));
for (const item of CIUDADES_PAISES_LIST) CIUDADES_PAISES_SET.add(normalizeSpanish(item));
for (const item of COLORES_LIST) COLORES_SET.add(normalizeSpanish(item));
for (const item of ANIMALES_LIST) ANIMALES_SET.add(normalizeSpanish(item));
for (const item of FRUTAS_VERDURAS_LIST) FRUTAS_VERDURAS_SET.add(normalizeSpanish(item));

// Also combine all named terms into the master GENERAL_WORDS_SET
for (const s of [NOMBRES_SET, APELLIDOS_SET, CIUDADES_PAISES_SET, COLORES_SET, ANIMALES_SET, FRUTAS_VERDURAS_SET]) {
  for (const word of s) {
    GENERAL_WORDS_SET.add(word);
  }
}

/**
 * Strict category validator
 */
export function validarPalabraPorCategoria(
  palabra: string, 
  categoryId: string, 
  currentLetter: string
): { isValid: boolean; reason: string } {
  if (!palabra || palabra.trim().length === 0) {
    return { isValid: false, reason: "Casilla vacía" };
  }

  const clean = normalizeSpanish(palabra);
  const cleanLetter = normalizeSpanish(currentLetter);

  if (!clean.startsWith(cleanLetter)) {
    return { isValid: false, reason: `No empieza con "${currentLetter}"` };
  }

  // Minimum length check (prevent 1-letter nonsense)
  if (clean.length < 2) {
    return { isValid: false, reason: "Palabra demasiado corta" };
  }

  // Specific check per category
  switch (categoryId) {
    case 'nombre':
      if (NOMBRES_SET.has(clean)) {
        return { isValid: true, reason: "Nombre verificado ✓" };
      }
      return { isValid: false, reason: "Nombre no registrado (Requiere Aprobación 👍)" };

    case 'apellido':
      if (APELLIDOS_SET.has(clean)) {
        return { isValid: true, reason: "Apellido verificado ✓" };
      }
      return { isValid: false, reason: "Apellido no registrado (Requiere Aprobación 👍)" };

    case 'ciudad_pais':
    case 'ciudad_canton':
      if (CIUDADES_PAISES_SET.has(clean)) {
        return { isValid: true, reason: "Lugar verificado ✓" };
      }
      return { isValid: false, reason: "Ciudad/País no registrado (Requiere Aprobación 👍)" };

    case 'color':
      if (COLORES_SET.has(clean) || GENERAL_WORDS_SET.has(clean)) {
        return { isValid: true, reason: "Color verificado ✓" };
      }
      return { isValid: false, reason: "No es un color reconocido" };

    case 'animal':
      if (ANIMALES_SET.has(clean) || GENERAL_WORDS_SET.has(clean)) {
        return { isValid: true, reason: "Animal verificado ✓" };
      }
      return { isValid: false, reason: "No es un animal reconocido" };

    case 'fruta_verdura':
    case 'plato_tipico':
    case 'dulce_golosina':
      if (FRUTAS_VERDURAS_SET.has(clean) || GENERAL_WORDS_SET.has(clean)) {
        return { isValid: true, reason: "Alimento verificado ✓" };
      }
      return { isValid: false, reason: "No reconocido en diccionario" };

    case 'cosa':
    default:
      if (GENERAL_WORDS_SET.has(clean)) {
        return { isValid: true, reason: "Palabra en diccionario ✓" };
      }
      return { isValid: false, reason: "No encontrada en diccionario" };
  }
}

/**
 * General word verification (STRICT: returns false if not in dictionary)
 */
export function validarPalabra(palabra: string): boolean {
  if (!palabra) return false;
  const clean = normalizeSpanish(palabra);
  if (!clean || clean.length < 2) return false;
  return GENERAL_WORDS_SET.has(clean);
}

/**
 * Async API verification with strictly safe false fallback
 */
export async function verificarPalabraEnDiccionario(palabra: string): Promise<boolean> {
  if (!palabra || palabra.trim().length < 2) return false;
  const clean = normalizeSpanish(palabra);

  if (GENERAL_WORDS_SET.has(clean)) {
    return true;
  }

  // If not found in our vast RAM dictionary, do NOT blindly return true!
  return false;
}
