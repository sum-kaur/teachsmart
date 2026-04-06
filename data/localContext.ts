export interface LocalContextEntry {
  postcode: string;
  suburb: string;
  state: string;
  country: string;
  landmarks: string;
  context: string;
  bomCity: "sydney" | "melbourne" | "brisbane" | "perth" | "adelaide" | "hobart" | "darwin";
}

export const LOCAL_CONTEXT: Record<string, LocalContextEntry> = {
  "2150": {
    postcode: "2150",
    suburb: "Parramatta",
    state: "NSW",
    country: "Darug Country",
    landmarks: "Parramatta River, Parramatta Park",
    context: "Burramattagal people, Western Sydney urban growth",
    bomCity: "sydney",
  },
  "2000": {
    postcode: "2000",
    suburb: "Sydney CBD",
    state: "NSW",
    country: "Gadigal Country",
    landmarks: "Sydney Harbour, The Rocks",
    context: "Eora Nation, colonial history, harbour ecology",
    bomCity: "sydney",
  },
  "4870": {
    postcode: "4870",
    suburb: "Cairns",
    state: "QLD",
    country: "Yidinji and Gimuy Walubara Yidinji Country",
    landmarks: "Great Barrier Reef, Daintree Rainforest",
    context: "Reef ecology, tropical climate, Indigenous tourism",
    bomCity: "brisbane",
  },
  "3000": {
    postcode: "3000",
    suburb: "Melbourne CBD",
    state: "VIC",
    country: "Wurundjeri Woi Wurrung Country",
    landmarks: "Yarra River, Port Phillip Bay",
    context: "Kulin Nation, urban biodiversity, bay ecology",
    bomCity: "melbourne",
  },
  "6000": {
    postcode: "6000",
    suburb: "Perth CBD",
    state: "WA",
    country: "Whadjuk Noongar Country",
    landmarks: "Swan River, Kings Park",
    context: "Noongar seasons, Mediterranean climate, wildflowers",
    bomCity: "perth",
  },
};

export const STATE_FALLBACK: Record<string, Omit<LocalContextEntry, "postcode" | "bomCity"> & { bomCity: LocalContextEntry["bomCity"] }> = {
  NSW: { suburb: "New South Wales", state: "NSW", country: "Various Aboriginal Nations", landmarks: "Blue Mountains, Snowy Mountains, Hunter Valley", context: "Diverse landscapes, coastal and inland ecosystems", bomCity: "sydney" },
  QLD: { suburb: "Queensland", state: "QLD", country: "Various Aboriginal Nations", landmarks: "Great Barrier Reef, Daintree, Gold Coast", context: "Tropical and subtropical ecosystems, reef ecology", bomCity: "brisbane" },
  VIC: { suburb: "Victoria", state: "VIC", country: "Various Aboriginal Nations", landmarks: "Great Ocean Road, Dandenong Ranges, Port Phillip", context: "Temperate ecosystems, alpine regions, bay ecology", bomCity: "melbourne" },
  WA: { suburb: "Western Australia", state: "WA", country: "Various Aboriginal Nations", landmarks: "Ningaloo Reef, Kimberley, Pinnacles", context: "Ancient landscapes, unique biodiversity, Noongar seasons", bomCity: "perth" },
  SA: { suburb: "South Australia", state: "SA", country: "Various Aboriginal Nations", landmarks: "Flinders Ranges, Coorong, Kangaroo Island", context: "Arid landscapes, marine ecosystems, wine regions", bomCity: "adelaide" },
  TAS: { suburb: "Tasmania", state: "TAS", country: "Various Aboriginal Nations", landmarks: "Cradle Mountain, Freycinet, Southwest Wilderness", context: "Temperate rainforest, island ecology, endemic species", bomCity: "hobart" },
  ACT: { suburb: "Australian Capital Territory", state: "ACT", country: "Ngunnawal Country", landmarks: "Black Mountain, Lake Burley Griffin, Namadgi", context: "Grassland and woodland ecosystems, political history", bomCity: "sydney" },
  NT: { suburb: "Northern Territory", state: "NT", country: "Various Aboriginal Nations", landmarks: "Uluru, Kakadu, Katherine Gorge", context: "Desert and tropical ecosystems, rich First Nations culture", bomCity: "darwin" },
};

export const BOM_URLS: Record<string, string> = {
  sydney: "http://www.bom.gov.au/fwo/IDN60901/IDN60901.94767.json",
  melbourne: "http://www.bom.gov.au/fwo/IDV60901/IDV60901.95936.json",
  brisbane: "http://www.bom.gov.au/fwo/IDQ60901/IDQ60901.94576.json",
  perth: "http://www.bom.gov.au/fwo/IDW60901/IDW60901.94608.json",
  adelaide: "http://www.bom.gov.au/fwo/IDS60901/IDS60901.94672.json",
  hobart: "http://www.bom.gov.au/fwo/IDT60901/IDT60901.94970.json",
  darwin: "http://www.bom.gov.au/fwo/IDD60901/IDD60901.94120.json",
};

export const MOCK_WEATHER: Record<string, { temp: number; description: string; rainfall: number; wind: number }> = {
  sydney: { temp: 22, description: "Partly cloudy", rainfall: 0, wind: 15 },
  melbourne: { temp: 17, description: "Cool and windy", rainfall: 2.4, wind: 28 },
  brisbane: { temp: 28, description: "Mostly sunny", rainfall: 0, wind: 12 },
  perth: { temp: 24, description: "Clear and sunny", rainfall: 0, wind: 18 },
  adelaide: { temp: 20, description: "Mild and partly cloudy", rainfall: 0.2, wind: 20 },
  hobart: { temp: 14, description: "Overcast with showers", rainfall: 3.8, wind: 22 },
  darwin: { temp: 32, description: "Hot and humid", rainfall: 8.2, wind: 10 },
};
