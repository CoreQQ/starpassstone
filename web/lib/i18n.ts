// Localized copy for the French and Russian landing pages (/fr, /ru).
// These are full-content regional pages targeting the Côte d'Azur market —
// not thin duplicates — with their own metadata and hreflang cluster.

export type Locale = "fr" | "ru" | "it";

export type Dict = {
  htmlLang: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  switchToEnglish: string;
  hero: { eyebrow: string; title1: string; title2: string; sub: string; cta: string; cta2: string };
  stats: [string, string][];
  servicesTitle: string;
  servicesSub: string;
  services: { title: string; body: string }[];
  areaTitle: string;
  areaBody: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  aboutTitle: string;
  aboutBody: string;
  contactTitle: string;
  contactSub: string;
  form: { name: string; phone: string; submit: string; note: string; ok: string };
  labels: { address: string; phone: string; email: string; area: string };
  areaLine: string;
};

export const dictionaries: Record<Locale, Dict> = {
  fr: {
    htmlLang: "fr",
    metaTitle:
      "Starpass Stone — Travaux de pierre naturelle | Côte d'Azur & Monaco",
    metaDescription:
      "Tous travaux de pierre naturelle depuis 1998 : marbre, granit, onyx et travertin. Cheminées, hammams, saunas, escaliers, plans de travail et salles de bains. Nice, Cannes, Monaco, Saint-Tropez, Antibes. Service clé en main, du métré à l'entretien.",
    keywords: [
      "travaux de pierre naturelle",
      "marbrerie Côte d'Azur",
      "marbre Nice",
      "marbre Cannes",
      "marbre Monaco",
      "cheminée en pierre",
      "construction hammam",
      "construction sauna",
      "escalier en marbre",
      "plan de travail en pierre",
      "salle de bain en marbre",
      "tailleur de pierre French Riviera",
    ],
    switchToEnglish: "English version",
    hero: {
      eyebrow: "L'art de la pierre depuis 1998",
      title1: "La pierre naturelle",
      title2: "dans le design.",
      sub: "Intérieurs, cheminées, hammams et saunas sur mesure en marbre, granit, onyx et quartzite — conçus, fabriqués et installés clé en main sur la Côte d'Azur, du premier métré à l'entretien.",
      cta: "Nos réalisations",
      cta2: "Parler à un spécialiste",
    },
    stats: [
      ["25+", "Ans de métier"],
      ["A→Z", "Clé en main"],
      ["100%", "Pierre naturelle"],
    ],
    servicesTitle: "Tous les travaux de pierre",
    servicesSub:
      "Produits en pierre naturelle de tout style et de toute complexité — une seule équipe, de la conception à la pose.",
    services: [
      { title: "Cheminées", body: "Cheminées classiques, électriques et bio-éthanol habillées de pierre." },
      { title: "Hammams", body: "Construction de bains turcs privés et commerciaux, mosaïque et marbre." },
      { title: "Saunas", body: "Saunas finlandais : équipement, fabrication, solutions d'ingénierie." },
      { title: "Escaliers", body: "Escaliers massifs et habillés, conçus pour durer toute une vie." },
      { title: "Plans de travail", body: "Plans de cuisine et tables découpés dans une seule tranche assortie." },
      { title: "Salles de bains", body: "Vasques, parois, sols et baignoires en pierre coordonnée." },
      { title: "Colonnes en marbre", body: "Colonnes et éléments architecturaux finis à la main." },
      { title: "Barbecues d'extérieur", body: "Zones barbecue et cuisines d'été en pierre, faites pour l'extérieur." },
      { title: "Restauration", body: "Restauration, entretien et suivi d'auteur de vos ouvrages en pierre." },
    ],
    areaTitle: "Zone d'intervention",
    areaBody:
      "Nous intervenons sur toute la Côte d'Azur : Nice, Cannes, Monaco, Saint-Tropez, Antibes, Menton — ainsi qu'à Dublin et dans toute l'Irlande. Notre équipe se déplace pour le métré, la pose et le suivi d'auteur.",
    faqTitle: "Questions fréquentes",
    faq: [
      {
        q: "Quels travaux de pierre réalisez-vous ?",
        a: "Tous les travaux de pierre naturelle : fourniture et sélection de marbre, granit, onyx, travertin et quartzite ; fabrication et pose de cheminées, escaliers, colonnes, plans de travail, salles de bains, façades et sols ; construction de hammams et saunas ; restauration et entretien.",
      },
      {
        q: "Intervenez-vous sur la Côte d'Azur ?",
        a: "Oui. Nous réalisons des projets à Nice, Cannes, Monaco, Saint-Tropez, Antibes et Menton, ainsi qu'en Irlande. L'équipe se déplace sur site pour le métré, l'installation et le suivi.",
      },
      {
        q: "Avec quelles pierres travaillez-vous ?",
        a: "Une palette sélectionnée dans les carrières du monde entier : marbre Calacatta, quartzite Sadolit Blue, labradorite ukrainienne, marbre Nero Marquina et onyx translucide, entre autres.",
      },
      {
        q: "Combien coûtera mon projet ?",
        a: "Nous fournissons des estimations transparentes et des conseils clairs avant tout début de travaux. Envoyez-nous votre idée et nous préparerons un chiffrage précis.",
      },
      {
        q: "Prenez-vous en charge tout le projet ?",
        a: "Oui — du métré aux travaux clé en main et à l'entretien, avec le suivi d'auteur à chaque étape, depuis 1998.",
      },
    ],
    aboutTitle: "Starpass Stone",
    aboutBody:
      "Depuis 1998, Starpass Stone s'est imposé comme un partenaire fiable et un professionnel de haut niveau. Notre cœur de métier : la sélection de pierre naturelle et la fabrication d'ouvrages de tout style et de toute complexité — cheminées, barbecues, plans de travail — avec conception d'intérieurs, de façades et de sols sous suivi d'auteur complet.",
    contactTitle: "Planifions votre projet",
    contactSub:
      "Du métré à l'installation clé en main et à l'entretien. Laissez votre numéro et Petro Rudenko vous guidera dans le choix de votre pierre.",
    form: {
      name: "Votre nom",
      phone: "Votre téléphone",
      submit: "Envoyer la demande",
      note: "Laissez vos coordonnées et nous vous contacterons sur WhatsApp.",
      ok: "Merci ! Nous vous contacterons sur WhatsApp.",
    },
    labels: { address: "Adresse", phone: "Téléphone", email: "E-mail", area: "Zone d'intervention" },
    areaLine: "Côte d'Azur : Nice · Cannes · Monaco · Saint-Tropez · Antibes · Menton — et Dublin, Irlande",
  },

  ru: {
    htmlLang: "ru",
    metaTitle:
      "Starpass Stone — Работы с натуральным камнем | Лазурный берег и Монако",
    metaDescription:
      "Любые работы с натуральным камнем с 1998 года: мрамор, гранит, оникс, травертин. Камины, хаммамы, сауны, лестницы, столешницы и ванные комнаты. Ницца, Канны, Монако, Сен-Тропе, Антиб. Под ключ — от замера до обслуживания.",
    keywords: [
      "работы с камнем",
      "натуральный камень Лазурный берег",
      "мрамор Ницца",
      "мрамор Канны",
      "мрамор Монако",
      "камин из камня",
      "строительство хаммама",
      "строительство сауны",
      "мраморная лестница",
      "столешница из камня",
      "ванная из мрамора",
      "изделия из мрамора Лазурный берег",
    ],
    switchToEnglish: "English version",
    hero: {
      eyebrow: "Мастерство в камне с 1998 года",
      title1: "Натуральный камень",
      title2: "в дизайне.",
      sub: "Интерьеры, камины, хаммамы и сауны на заказ из мрамора, гранита, оникса и кварцита — проектируем, производим и устанавливаем под ключ на Лазурном берегу: от первого замера до пожизненного обслуживания.",
      cta: "Наши работы",
      cta2: "Поговорить со специалистом",
    },
    stats: [
      ["25+", "Лет мастерства"],
      ["A→Z", "Под ключ"],
      ["100%", "Натуральный камень"],
    ],
    servicesTitle: "Любые работы с камнем",
    servicesSub:
      "Изделия из натурального камня любого стиля и сложности — одна команда от проекта до монтажа.",
    services: [
      { title: "Камины", body: "Классические, электрические и биокамины в каменном обрамлении." },
      { title: "Хаммамы", body: "Строительство турецких бань для дома и бизнеса: мозаика и мрамор." },
      { title: "Сауны", body: "Финские сауны: оборудование, производство, инженерные решения." },
      { title: "Лестницы", body: "Массивные и облицованные каменные лестницы на десятилетия." },
      { title: "Столешницы", body: "Кухонные столешницы и столы из цельного подобранного слэба." },
      { title: "Ванные комнаты", body: "Раковины, стены, полы и ванны из подобранного камня." },
      { title: "Мраморные колонны", body: "Колонны и архитектурные элементы ручной обработки." },
      { title: "Уличные BBQ", body: "Каменные барбекю-зоны и летние кухни для улицы." },
      { title: "Реставрация", body: "Реставрация, уход и авторское сопровождение каменных изделий." },
    ],
    areaTitle: "География работ",
    areaBody:
      "Работаем по всему Лазурному берегу: Ницца, Канны, Монако, Сен-Тропе, Антиб, Ментон — а также в Дублине и по всей Ирландии. Команда выезжает на объект для замера, монтажа и авторского надзора.",
    faqTitle: "Частые вопросы",
    faq: [
      {
        q: "Какие работы с камнем вы выполняете?",
        a: "Любые работы с натуральным камнем: поставка и подбор мрамора, гранита, оникса, травертина и кварцита; изготовление и монтаж каминов, лестниц, колонн, столешниц, ванных, фасадов и полов; строительство хаммамов и саун; реставрация и обслуживание.",
      },
      {
        q: "Работаете ли вы на Лазурном берегу?",
        a: "Да. Выполняем проекты в Ницце, Каннах, Монако, Сен-Тропе, Антибе и Ментоне, а также в Ирландии. Команда выезжает на объект для замера, установки и сопровождения.",
      },
      {
        q: "С какими камнями вы работаете?",
        a: "Палитра из карьеров по всему миру: мрамор Калакатта, кварцит Sadolit Blue, украинский лабрадорит, мрамор Неро Маркина, полупрозрачный оникс и другие.",
      },
      {
        q: "Сколько будет стоить мой проект?",
        a: "Прозрачная смета и понятные рекомендации до начала любых работ. Пришлите вашу идею — подготовим расчёт под конкретный проект.",
      },
      {
        q: "Вы берёте проект целиком?",
        a: "Да — от замеров до работ под ключ и последующего обслуживания, с авторским надзором на каждом этапе. Работаем с 1998 года.",
      },
    ],
    aboutTitle: "Starpass Stone",
    aboutBody:
      "С 1998 года Starpass Stone — надёжный партнёр и профессионал высокого уровня. Основной профиль — подбор натурального камня и производство изделий любого стиля и сложности: камины, барбекю, столешницы; разработка интерьеров, фасадов и полов с полным авторским сопровождением.",
    contactTitle: "Обсудим ваш проект",
    contactSub:
      "От замеров до установки под ключ и обслуживания. Оставьте номер — Пётр Руденко поможет выбрать камень для вашего проекта.",
    form: {
      name: "Ваше имя",
      phone: "Ваш телефон",
      submit: "Отправить заявку",
      note: "Оставьте контакты — мы свяжемся с вами в WhatsApp.",
      ok: "Спасибо! Мы свяжемся с вами в WhatsApp.",
    },
    labels: { address: "Адрес", phone: "Телефон", email: "E-mail", area: "География" },
    areaLine: "Лазурный берег: Ницца · Канны · Монако · Сен-Тропе · Антиб · Ментон — и Дублин, Ирландия",
  },

  it: {
    htmlLang: "it",
    metaTitle:
      "Starpass Stone — Lavorazione della pietra naturale | Costa Azzurra & Monaco",
    metaDescription:
      "Ogni lavorazione della pietra naturale dal 1998: marmo, granito, onice e travertino. Camini, hammam, saune, scale, piani di lavoro e bagni. Nizza, Cannes, Monaco, Saint-Tropez, Antibes. Chiavi in mano, dal rilievo alla manutenzione.",
    keywords: [
      "lavorazione pietra naturale",
      "marmista Costa Azzurra",
      "marmo Nizza",
      "marmo Cannes",
      "marmo Monaco",
      "camino in pietra",
      "costruzione hammam",
      "costruzione sauna",
      "scala in marmo",
      "piano di lavoro in pietra",
      "bagno in marmo",
      "opere in marmo Costa Azzurra",
    ],
    switchToEnglish: "English version",
    hero: {
      eyebrow: "L'arte della pietra dal 1998",
      title1: "La pietra naturale",
      title2: "nel design.",
      sub: "Interni, camini, hammam e saune su misura in marmo, granito, onice e quarzite — progettati, realizzati e installati chiavi in mano in Costa Azzurra, dal primo rilievo alla manutenzione.",
      cta: "I nostri lavori",
      cta2: "Parla con uno specialista",
    },
    stats: [
      ["25+", "Anni di mestiere"],
      ["A→Z", "Chiavi in mano"],
      ["100%", "Pietra naturale"],
    ],
    servicesTitle: "Ogni lavorazione della pietra",
    servicesSub:
      "Manufatti in pietra naturale di ogni stile e complessità — un'unica squadra, dal progetto alla posa.",
    services: [
      { title: "Camini", body: "Camini classici, elettrici e a bioetanolo rivestiti in pietra." },
      { title: "Hammam", body: "Costruzione di bagni turchi privati e commerciali: mosaico e marmo." },
      { title: "Saune", body: "Saune finlandesi: attrezzature, produzione, soluzioni ingegneristiche." },
      { title: "Scale", body: "Scale massicce e rivestite, progettate per durare una vita." },
      { title: "Piani di lavoro", body: "Piani cucina e tavoli ricavati da un'unica lastra abbinata." },
      { title: "Bagni", body: "Lavabi, pareti, pavimenti e vasche in pietra coordinata." },
      { title: "Colonne in marmo", body: "Colonne ed elementi architettonici rifiniti a mano." },
      { title: "Barbecue da esterno", body: "Zone barbecue e cucine estive in pietra, fatte per l'esterno." },
      { title: "Restauro", body: "Restauro, manutenzione e supervisione d'autore delle opere in pietra." },
    ],
    areaTitle: "Zona di intervento",
    areaBody:
      "Operiamo in tutta la Costa Azzurra: Nizza, Cannes, Monaco, Saint-Tropez, Antibes, Mentone — oltre che a Dublino e in tutta l'Irlanda. La squadra si sposta in loco per rilievo, posa e supervisione d'autore.",
    faqTitle: "Domande frequenti",
    faq: [
      {
        q: "Quali lavorazioni della pietra eseguite?",
        a: "Ogni lavorazione della pietra naturale: fornitura e selezione di marmo, granito, onice, travertino e quarzite; realizzazione e posa di camini, scale, colonne, piani di lavoro, bagni, facciate e pavimenti; costruzione di hammam e saune; restauro e manutenzione.",
      },
      {
        q: "Lavorate in Costa Azzurra?",
        a: "Sì. Realizziamo progetti a Nizza, Cannes, Monaco, Saint-Tropez, Antibes e Mentone, oltre che in Irlanda. La squadra si sposta in cantiere per rilievo, installazione e supervisione.",
      },
      {
        q: "Con quali pietre lavorate?",
        a: "Una palette selezionata nelle cave di tutto il mondo: marmo Calacatta, quarzite Sadolit Blue, labradorite ucraina, marmo Nero Marquina e onice traslucido, tra gli altri.",
      },
      {
        q: "Quanto costerà il mio progetto?",
        a: "Forniamo preventivi trasparenti e indicazioni chiare prima di iniziare qualsiasi lavoro. Inviateci la vostra idea e prepareremo un preventivo su misura.",
      },
      {
        q: "Seguite l'intero progetto?",
        a: "Sì — dal rilievo ai lavori chiavi in mano e alla manutenzione, con supervisione d'autore in ogni fase, dal 1998.",
      },
    ],
    aboutTitle: "Starpass Stone",
    aboutBody:
      "Dal 1998 Starpass Stone è un partner affidabile e un professionista di alto livello. Il nostro core business: selezione della pietra naturale e produzione di manufatti di ogni stile e complessità — camini, barbecue, piani di lavoro — con progettazione di interni, facciate e pavimenti sotto completa supervisione d'autore.",
    contactTitle: "Pianifichiamo il vostro progetto",
    contactSub:
      "Dal rilievo all'installazione chiavi in mano e alla manutenzione. Lasciate il vostro numero e Petro Rudenko vi guiderà nella scelta della pietra.",
    form: {
      name: "Il vostro nome",
      phone: "Il vostro telefono",
      submit: "Invia la richiesta",
      note: "Lasciate i vostri contatti e vi ricontatteremo su WhatsApp.",
      ok: "Grazie! Vi contatteremo su WhatsApp.",
    },
    labels: { address: "Indirizzo", phone: "Telefono", email: "E-mail", area: "Zona di intervento" },
    areaLine: "Costa Azzurra: Nizza · Cannes · Monaco · Saint-Tropez · Antibes · Mentone — e Dublino, Irlanda",
  },
};
