describe("Tracking service - ETA calculation", () => {
  it("haversine distance should calculate correctly for known coordinates", () => {
    const EARTH_RADIUS_KM = 6371;

    function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return EARTH_RADIUS_KM * c;
    }

    const lagosToIkeja = haversineDistance(6.4541, 3.3947, 6.6018, 3.3515);
    expect(lagosToIkeja).toBeGreaterThan(10);
    expect(lagosToIkeja).toBeLessThan(30);

    const samePoint = haversineDistance(6.4541, 3.3947, 6.4541, 3.3947);
    expect(samePoint).toBe(0);

    const lagosToAbuja = haversineDistance(6.4541, 3.3947, 9.0579, 7.4951);
    expect(lagosToAbuja).toBeGreaterThan(400);
    expect(lagosToAbuja).toBeLessThan(600);
  });

  it("ETA should be calculated from distance and average speed", () => {
    const AVERAGE_SPEED_KMH = 20;
    const distanceKm = 15;
    const minutes = Math.ceil((distanceKm / AVERAGE_SPEED_KMH) * 60);
    expect(minutes).toBe(45);
  });

  it("ETA for zero distance should be zero", () => {
    const AVERAGE_SPEED_KMH = 20;
    const distanceKm = 0;
    const minutes = Math.ceil((distanceKm / AVERAGE_SPEED_KMH) * 60);
    expect(minutes).toBe(0);
  });

  it("ETA for very short distance should be at least 1 minute (ceiling)", () => {
    const AVERAGE_SPEED_KMH = 20;
    const distanceKm = 0.1;
    const minutes = Math.ceil((distanceKm / AVERAGE_SPEED_KMH) * 60);
    expect(minutes).toBe(1);
  });
});
