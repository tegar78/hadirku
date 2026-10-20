/**
 * Calculate Great-Circle Distance between two coordinates using Haversine Formula.
 * As defined in PRD Section 3.1:
 * d = 2r * arcsin(sqrt(sin^2(dPhi/2) + cos(phi1) * cos(phi2) * sin^2(dLambda/2)))
 * 
 * @param {number} lat1 Latitude of point 1 (User)
 * @param {number} lon1 Longitude of point 1 (User)
 * @param {number} lat2 Latitude of point 2 (Office)
 * @param {number} lon2 Longitude of point 2 (Office)
 * @returns {number} Distance in meters
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS_METERS = 6371000; // r in meters

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_METERS * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

module.exports = {
  calculateHaversineDistance,
};
