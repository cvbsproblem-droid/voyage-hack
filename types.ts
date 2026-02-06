
export enum HotelTier {
  BUDGET = 'Budget',
  STANDARD = 'Standard',
  LUXURY = 'Luxury'
}

export enum TransportMode {
  FLIGHT = 'Flight',
  TRAIN = 'Train',
  BUS = 'Bus',
  CAB = 'Cab'
}

export interface HotelOffer {
  hotelCode: string;
  name: string;
  rating: number;
  pricePerNight: number;
  currency: string;
  thumbnail: string;
  description: string;
}

export interface CityNode {
  id: string;
  name: string;
  nights: number;
  hotelTier: HotelTier;
  selectedHotel?: HotelOffer;
  mealPlan: string;
  experiences: string[];
  description: string;
  imageUrl?: string;
  coordinates?: { lat: number; lng: number };
}

export interface TransportEdge {
  id: string;
  fromId: string;
  toId: string;
  mode: TransportMode;
  duration: string;
  cost: number;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  nodes: CityNode[];
  edges: TransportEdge[];
  totalCost: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}
