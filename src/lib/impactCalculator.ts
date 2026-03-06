import * as THREE from "three";
import { Asteroid } from "@/services/nasaService";

export interface ImpactMetrics {
  lat: number;
  lon: number;
  isWater: boolean;
  
  // Ablation Stats
  originalDiameterKm: number;
  finalDiameterKm: number;
  burnPercentage: number;
  
  // Energy Stats
  kineticEnergyMegatons: number;
  craterDiameterKm: number;
  tsunamiHeightMeters: number;
  estimatedCasualties: number;
  evacuationRadiusKm: number;
  fireballRadiusKm: number;

  // Seismic
  richterMagnitude: number;
  seismicRadiusKm: number;

  // Recurrence
  recurrencePeriodYears: number;
}

// Average density of a rocky asteroid (kg/m^3)
const ASTEROID_DENSITY = 3000; 

/**
 * Calculates devastation metrics using simplified kinetic physics equations.
 */
export function calculateImpactMetrics(asteroid: Asteroid, impactPoint: THREE.Vector3, earthRadius: number): ImpactMetrics {
  // Convert 3D click point → geographic lat/lon
  //
  // THREE.SphereGeometry vertex equations (from source):
  //   x = -cos(phi) * sin(theta)
  //   y =  cos(theta)
  //   z =  sin(phi) * sin(theta)
  //
  // Therefore:  phi = atan2(z, -x)
  //             theta = acos(y)  →  lat = 90 - theta
  //
  // UV mapping: u = phi / 2PI  (0 at X-, 0.25 at Z+, 0.5 at X+, 0.75 at Z-)
  // NASA texture: u=0 → lon -180°, u=0.5 → lon 0°, u=1 → lon 180°
  // So: lon = phi * 180/PI - 180, then normalise to [-180, 180]
  const normalized = impactPoint.clone().normalize();
  const latRads = Math.asin(Math.max(-1, Math.min(1, normalized.y)));
  let lon = Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI) - 180;
  if (lon <= -180) lon += 360;  // normalise from (-360, 0] to (-180, 180]
  const lat = latRads * (180 / Math.PI);

  // Approximate land vs water (simple seeded pseudorandom approach based on coordinates for demo purposes)
  const landSeed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233)) * 43758.5453;
  const isWater = (landSeed - Math.floor(landSeed)) > 0.3; // Roughly 70% of Earth is water

  // 2. Physics - Atmospheric Ablation (Burn Rate)
  const originalDiameterKm = asteroid.estimated_diameter.kilometers.estimated_diameter_max;
  
  // Smaller rocks burn faster. A rock < 0.025km (25m) usually burns up almost entirely.
  // We use an exponential decay curve to simulate this atmospheric shielding.
  let finalDiameterKm = originalDiameterKm;
  let burnPercentage = 0;

  if (originalDiameterKm < 0.05) {
    // 50m rocks lose significant mass
    burnPercentage = 70 + (Math.random() * 25); 
  } else if (originalDiameterKm < 0.1) {
    // 100m rocks survive better, maybe lose 30-50%
    burnPercentage = 30 + (Math.random() * 20);
  } else if (originalDiameterKm < 1.0) {
    // 1km rocks only get the edges singed essentially
    burnPercentage = 5 + (Math.random() * 10);
  } else {
    // Planet killers don't care about the atmosphere
    burnPercentage = Math.random() * 2;
  }

  // Calculate new reduced structural mass
  finalDiameterKm = originalDiameterKm * (1 - (burnPercentage / 100));
  
  let radiusMeters = (finalDiameterKm * 1000) / 2;
  // If it burnt up totally, cap it
  if (finalDiameterKm < 0.005) {
    finalDiameterKm = 0;
    radiusMeters = 0;
  }

  const volumeCubicMeters = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3);
  let massKg = volumeCubicMeters * ASTEROID_DENSITY;

  // 3. Kinetic Energy
  const velocityKmh = parseFloat(asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_hour || "0");
  const velocityMs = (velocityKmh * 1000) / 3600;

  // KE = 1/2 m v^2
  let kineticEnergyJoules = 0.5 * massKg * Math.pow(velocityMs, 2);
  let kineticEnergyMegatons = kineticEnergyJoules / 4.184e15;

  // If entirely burnt or near it, yield is neglible airburst (simplified)
  if (finalDiameterKm === 0) {
    kineticEnergyMegatons = 0;
  }

  // 4. Devastation Radiuses 
  // Crater diameter scales roughly with the cube root of yield
  const craterDiameterKm = 1.16 * Math.pow(kineticEnergyMegatons, 1/3); 
  
  // Fireball radius (thermal pulse)
  const fireballRadiusKm = Math.max(0.5, 0.2 * Math.pow(kineticEnergyMegatons, 0.4));
  
  // Blast wave / Evacuation zone (where structures collapse)
  const evacuationRadiusKm = fireballRadiusKm * 15;

  // 5. Specific Devastation
  let tsunamiHeightMeters = 0;
  let estimatedCasualties = 0;

  if (kineticEnergyMegatons > 0.1) {
    if (isWater) {
      tsunamiHeightMeters = Math.min(3000, radiusMeters * 1.5); 
      estimatedCasualties = Math.floor(tsunamiHeightMeters * 500 * (1 + Math.random())); 
    } else {
      const baseDensity = 50; 
      const affectedArea = Math.PI * Math.pow(evacuationRadiusKm, 2);
      estimatedCasualties = Math.floor(affectedArea * baseDensity * (0.5 + Math.random() * 0.5));
    }
  }

  // 6. Seismic impact - Richter magnitude from energy (log scale)
  // Using: Mw = (2/3) * log10(Moment) - 6.07. Simplified from energy (in Joules)
  const richterMagnitude = kineticEnergyJoules > 0 
    ? parseFloat(((Math.log10(kineticEnergyJoules) - 4.8) / 1.5).toFixed(1))
    : 0;
  const seismicRadiusKm = Math.max(0, Math.pow(10, (richterMagnitude - 3.5) / 1.2));

  // 7. Rough statistical recurrence period (years)
  // Small impactors hit often, big ones rarely. Exponential scaling.
  const recurrencePeriodYears = kineticEnergyMegatons > 0
    ? Math.round(Math.pow(kineticEnergyMegatons, 0.8) * 100)
    : 1;

  return {
    lat,
    lon,
    isWater,
    originalDiameterKm,
    finalDiameterKm,
    burnPercentage,
    kineticEnergyMegatons,
    craterDiameterKm,
    tsunamiHeightMeters,
    estimatedCasualties,
    evacuationRadiusKm,
    fireballRadiusKm,
    richterMagnitude,
    seismicRadiusKm,
    recurrencePeriodYears,
  };
}


