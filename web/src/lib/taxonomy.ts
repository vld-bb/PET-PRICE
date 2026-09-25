export interface SubCategory {
  slug: string;
  name: string;
  badge?: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  iconName?: string;
  items: SubCategory[];
}

export interface SpeciesTaxonomy {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  icon: string; // emoji or icon identifier
  tagline: string;
  groups: CategoryGroup[];
}

export const PET_TAXONOMY: SpeciesTaxonomy[] = [
  {
    id: "koer",
    slug: "koerad",
    name: "Koeratooted",
    shortName: "Koerad",
    icon: "🐶",
    tagline: "Kõik koeratoit, rihmad, pesad ja hooldustarbed",
    groups: [
      {
        id: "toit_maiused",
        name: "Toit & Maiused",
        items: [
          { slug: "kuivtoit", name: "Kuivtoit koertele", badge: "Populaarne" },
          { slug: "margtoit", name: "Märgtoit & Konservid" },
          { slug: "maiused", name: "Maiused & Närimiskondid" },
          { slug: "veterinaartoit", name: "Veterinaardieedid" },
          { slug: "sooginoud", name: "Kausid, jooginõud & sööturid" },
        ],
      },
      {
        id: "pesad_transport",
        name: "Magamine & Reisimine",
        items: [
          { slug: "pesad", name: "Pesad, padjad & asemed", badge: "Uus" },
          { slug: "transport", name: "Transpordipuurid & kandekotid" },
          { slug: "autovarustus", name: "Autovarustus & turvavööd" },
          { slug: "aedikud", name: "Aedikud & turvapiirded" },
        ],
      },
      {
        id: "manguasjad",
        name: "Mänguasjad & Treenimine",
        items: [
          { slug: "pallid_narimine", name: "Närimisasjad & pallid" },
          { slug: "interaktiivsed", name: "Interaktiivsed & nupukusmängud" },
          { slug: "koied_viskamine", name: "Köied & viskamismängud" },
          { slug: "treening", name: "Treeningvahendid & suukorvid" },
        ],
      },
      {
        id: "jalutamine_rihmad",
        name: "Jalutamine & Tarvikud",
        items: [
          { slug: "traksid", name: "Traksid & turvatrakse", badge: "Hitt" },
          { slug: "kaelarihmad", name: "Kaelarihmad & helkurid" },
          { slug: "jalutusrihmad", name: "Jalutusrihmad & Flexid" },
          { slug: "riided", name: "Riided, mantlid & jalanõud" },
        ],
      },
      {
        id: "hugieen_hooldus",
        name: "Hügieen & Puhtus",
        items: [
          { slug: "sampoonid", name: "Šampoonid & karvahooldus" },
          { slug: "harjad_kammid", name: "Harjad, kammid & trimmerid" },
          { slug: "kuuned_kapad", name: "Küünelõikurid & käpahooldus" },
          { slug: "mahked_puhastus", name: "Lõhnaeemaldajad & aluslinad" },
        ],
      },
      {
        id: "tervis",
        name: "Tervis & Heaolu",
        items: [
          { slug: "vitamiinid", name: "Vitamiinid & toidulisandid" },
          { slug: "parasiiditorje", name: "Parasiiditõrje (kirbud/puugid)", badge: "Hooaeg" },
          { slug: "liigesed", name: "Liigese- ja luutoidulisandid" },
          { slug: "hambahooldus", name: "Hambapastad & suuhooldus" },
        ],
      },
    ],
  },
  {
    id: "kass",
    slug: "kassid",
    name: "Kassitooted",
    shortName: "Kassid",
    icon: "🐱",
    tagline: "Kassitoidud, kraapimispuud, liivad ja mänguasjad",
    groups: [
      {
        id: "toit_maiused",
        name: "Toit & Maiused",
        items: [
          { slug: "kuivtoit", name: "Kuivtoit kassidele", badge: "Populaarne" },
          { slug: "margtoit", name: "Märgtoit, konservid & supid" },
          { slug: "maiused", name: "Maiused, pastad & kreemid" },
          { slug: "veterinaartoit", name: "Veterinaartoit & eridieedid" },
          { slug: "sooginoud", name: "Joogipurskkaevud & toidukausid" },
        ],
      },
      {
        id: "manguasjad",
        name: "Kraapimispuud & Ronimine",
        items: [
          { slug: "kraapimispuud", name: "Kraapimispuud & -postid", badge: "Hitt" },
          { slug: "ronimisseinad", name: "Ronimisseinad & rippkiiged" },
          { slug: "laserid_suled", name: "Laserid, suletutid & õnged" },
          { slug: "interaktiivsed", name: "Kassinaep & nutimänguasjad" },
        ],
      },
      {
        id: "hugieen_hooldus",
        name: "Liivad & Hügieen",
        items: [
          { slug: "kassiliivad", name: "Kassiliivad (bentoniit, puit, silikaat)", badge: "Ostetuim" },
          { slug: "liivakastid", name: "Kinnised & lahtised tualetid" },
          { slug: "tarvikud_tualett", name: "Liivalabidad, matid & filtrid" },
          { slug: "mahked_puhastus", name: "Lõhnaeemaldajad & pesuvahendid" },
        ],
      },
      {
        id: "pesad_transport",
        name: "Magamine & Transport",
        items: [
          { slug: "pesad", name: "Pehmed pesad, koopad & korvid" },
          { slug: "transport", name: "Kandekotid & transpordipuurid" },
          { slug: "radiaatoripesad", name: "Radiaatori- ja aknapesad" },
        ],
      },
      {
        id: "tervis",
        name: "Tervis & Hooldus",
        items: [
          { slug: "vitamiinid", name: "Karvapallipastad & vitamiinid" },
          { slug: "parasiiditorje", name: "Kirbu- ja puugitõrje" },
          { slug: "rahustid", name: "Feromoonid & rahustavad vahendid" },
          { slug: "harjad_kammid", name: "Kammid, kraasid & küünelõikurid" },
        ],
      },
    ],
  },
  {
    id: "vaikeloomad",
    slug: "vaikeloomad",
    name: "Väikeloomad & Närilised",
    shortName: "Närilised",
    icon: "🐰",
    tagline: "Küülikute, merisigade, hamstrite toidud ja puurid",
    groups: [
      {
        id: "toit_maiused",
        name: "Toit & Hein",
        items: [
          { slug: "toit_kuulikud", name: "Küülikute & merisigade toidud" },
          { slug: "toit_hamstrid", name: "Hamstrite, hiirte & rottide söödad" },
          { slug: "hein_maiused", name: "Naturaalne hein & ravimtaimed", badge: "Oluline" },
          { slug: "maiused", name: "Närimiskivid & maiusepulgad" },
        ],
      },
      {
        id: "pesad_transport",
        name: "Puurid & Sisustus",
        items: [
          { slug: "puurid", name: "Puurid & suvised aedikud" },
          { slug: "sisustus", name: "Majakesed, tunnelid & jooksurattad" },
          { slug: "jooginoud", name: "Joogipudelid & heinasõimed" },
        ],
      },
      {
        id: "hugieen_hooldus",
        name: "Aluspanu & Puhtus",
        items: [
          { slug: "aluspanu", name: "Puitgraanulid, laastud & kanepialuspanu" },
          { slug: "puhastus", name: "Puuri desinfitseerijad & tualetid" },
        ],
      },
    ],
  },
  {
    id: "linnud",
    slug: "linnud",
    name: "Linnud",
    shortName: "Linnud",
    icon: "🦜",
    tagline: "Papagoide, viirpapagoide ja lindude söödad ja puurid",
    groups: [
      {
        id: "toit_maiused",
        name: "Toit & Maiustused",
        items: [
          { slug: "seemned", name: "Täisseemnesegud papagoidele" },
          { slug: "maiusepulgad", name: "Küpsetatud maiusepulgad" },
          { slug: "mineraalid", name: "Seepiakivid & mineraalplokid" },
        ],
      },
      {
        id: "pesad_transport",
        name: "Puurid & Aksessuaarid",
        items: [
          { slug: "linnupuurid", name: "Linnupuurid & stendid" },
          { slug: "orred_kiiged", name: "Õrred, kiiged & ronimisredelid" },
          { slug: "vannid_topsid", name: "Suplusvannid & söögitopsid" },
        ],
      },
    ],
  },
  {
    id: "kalad",
    slug: "kalad",
    name: "Kalad & Akvaarium",
    shortName: "Akvaarium",
    icon: "🐠",
    tagline: "Helvestoidud, filtrid, veehooldus ja dekoratsioonid",
    groups: [
      {
        id: "toit_maiused",
        name: "Kalatoidud",
        items: [
          { slug: "helvestoit", name: "Helvestoidud & graanulid" },
          { slug: "pohjakaladele", name: "Põhjakalade & krevettide toidud" },
          { slug: "eritoit", name: "Külmkuivatatud & puhkusetoidud" },
        ],
      },
      {
        id: "hugieen_hooldus",
        name: "Tehnika & Veehooldus",
        items: [
          { slug: "tehnika", name: "Sisefiltrid, pumbad & soojendid" },
          { slug: "veehooldus", name: "Veetestid, palsamid & bakterid" },
          { slug: "dekoratsioonid", name: "Põhjakruus, kivid & taimed" },
        ],
      },
    ],
  },
  {
    id: "eksootilised",
    slug: "eksootilised",
    name: "Eksootilised & Roomajad",
    shortName: "Roomajad",
    icon: "🐢",
    tagline: "Terraariumid, soojuslambid ja roomajate toidud",
    groups: [
      {
        id: "pesad_transport",
        name: "Terraariumid & Kliima",
        items: [
          { slug: "terraariumid", name: "Terraariumid & faunabox'id" },
          { slug: "valgustus_soojus", name: "UV-lambid & soojendusmatid" },
        ],
      },
      {
        id: "toit_maiused",
        name: "Toit & Vitamiinid",
        items: [
          { slug: "roomajate_toit", name: "Toidud kilpkonnadele & sisalikele" },
          { slug: "vitamiinid", name: "Kaltsium & D3 vitamiinipulbrid" },
        ],
      },
    ],
  },
];

export function findTaxonomyInfo(animalId?: string, categorySlug?: string) {
  if (!animalId && !categorySlug) return null;

  const species = PET_TAXONOMY.find(
    (s) => s.id === animalId || s.slug === animalId
  );

  let group: CategoryGroup | undefined;
  let subcat: SubCategory | undefined;

  if (species && categorySlug) {
    for (const g of species.groups) {
      const found = g.items.find((i) => i.slug === categorySlug);
      if (found) {
        group = g;
        subcat = found;
        break;
      }
    }
  } else if (categorySlug) {
    for (const s of PET_TAXONOMY) {
      for (const g of s.groups) {
        const found = g.items.find((i) => i.slug === categorySlug);
        if (found) {
          return { species: s, group: g, subcat: found };
        }
      }
    }
  }

  return { species, group, subcat };
}
