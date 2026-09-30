import { describe, expect, it } from "vitest";
import { haversineKm } from "../lib/geo";

describe("haversineKm", () => {
  it("is ~0 for identical points", () => {
    expect(haversineKm(27.47, 95.32, 27.47, 95.32)).toBeLessThan(0.001);
  });

  it("accurately computes ~1 km north offset", () => {
    // 1 deg latitude is approximately 110.574 km
    const d = haversineKm(27.472, 95.318, 27.472 + 1 / 110.574, 95.318);
    expect(d).toBeGreaterThan(0.95);
    expect(d).toBeLessThan(1.05);
  });

  it("accurately computes east-west offset at latitude 27.47", () => {
    const lat = 27.472;
    const cosLat = Math.cos((lat * Math.PI) / 180);
    // 5 km east offset
    const dLon = 5.0 / (111.32 * cosLat);
    const d = haversineKm(lat, 95.318, lat, 95.318 + dLon);
    expect(d).toBeGreaterThan(4.9);
    expect(d).toBeLessThan(5.1);
  });

  it("handles negative coordinates across hemispheres", () => {
    const d = haversineKm(-10.0, -20.0, -10.1, -20.0);
    expect(d).toBeGreaterThan(10);
    expect(d).toBeLessThan(12);
  });

  it("handles extreme coordinates correctly", () => {
    expect(haversineKm(0, 0, 0, 0)).toBe(0);
    const equatorPole = haversineKm(0, 0, 90, 0);
    // ~10,000 km from equator to pole
    expect(equatorPole).toBeGreaterThan(9900);
    expect(equatorPole).toBeLessThan(10100);
  });
});

