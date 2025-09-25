import axios from "axios";

/**
 * Get latitude, longitude, and timezone from an address using Google Geocoding + Timezone API
 * @param {string} address - Full address string (e.g., "New Delhi, India")
 * @returns {Promise<{lat: number, lng: number, timeZoneId: string, timeZoneName: string}>}
 */
export async function getLatLngFromAddress(address:string) {
  try {
    if (!address) throw new Error("Address is required");

    const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Store in .env

    // Step 1: Get Lat/Lng from address
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;

    const { data: geoData } = await axios.get(geoUrl);

    if (geoData.status !== "OK" || !geoData.results.length) {
      throw new Error("Unable to fetch location. Check the address.");
    }

    const { lat, lng } = geoData.results[0].geometry.location;

    // Step 2: Get timezone using Lat/Lng
    const timestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const tzUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`;

    const { data: tzData } = await axios.get(tzUrl);

    if (tzData.status !== "OK") {
      throw new Error("Unable to fetch timezone.");
    }

    return {
      lat,
      lng,
      timeZoneId: tzData.timeZoneId,   // e.g., "Asia/Kolkata"
      timeZoneName: tzData.timeZoneName // e.g., "India Standard Time"
    };
  } catch (error) {
    console.error("Error in getLocationAndTimezone:", error.message);
    throw error;
  }
}
