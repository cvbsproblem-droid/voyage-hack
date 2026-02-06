
import { HotelOffer, HotelTier } from "../types";

/**
 * TBO Holidays Staging API Configuration
 * URL: http://api.tbotechnology.in/TBOHolidays_HotelAPI
 * User: hackathontest
 * Pass: Hac@98147521
 */

export const fetchTboHotelOffers = async (cityName: string, tier: HotelTier): Promise<HotelOffer[]> => {
  // Simulating a backend call using the provided TBO credentials
  // In a real implementation, this would be a POST request to the TBO Search endpoint
  console.log(`[TBO API] Searching hotels in ${cityName} for tier: ${tier} using user: hackathontest`);
  
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency

  // Mocked TBO responses based on tier
  const basePrice = tier === HotelTier.LUXURY ? 450 : tier === HotelTier.STANDARD ? 180 : 75;
  const rating = tier === HotelTier.LUXURY ? 5 : tier === HotelTier.STANDARD ? 4 : 3;

  return [
    {
      hotelCode: `TBO-${Math.random().toString(36).substr(2, 5)}`,
      name: `${cityName} ${tier} Grand Hotel`,
      rating: rating,
      pricePerNight: basePrice + Math.floor(Math.random() * 50),
      currency: "USD",
      thumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=100&q=80",
      description: "Excellent location with premium TBO curated amenities."
    },
    {
      hotelCode: `TBO-${Math.random().toString(36).substr(2, 5)}`,
      name: `The ${cityName} Residency`,
      rating: rating,
      pricePerNight: basePrice - 20 + Math.floor(Math.random() * 30),
      currency: "USD",
      thumbnail: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=100&q=80",
      description: "Best value offer for the current season."
    },
    {
      hotelCode: `TBO-${Math.random().toString(36).substr(2, 5)}`,
      name: `City View ${cityName} Suites`,
      rating: rating - 1,
      pricePerNight: basePrice - 40 + Math.floor(Math.random() * 20),
      currency: "USD",
      thumbnail: "https://images.unsplash.com/photo-1551882547-ff43c63faf76?auto=format&fit=crop&w=100&q=80",
      description: "Modern minimalist design near transit hubs."
    }
  ];
};
