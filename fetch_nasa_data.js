const fs = require('fs');

async function fetchAsteroids() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    console.log(`Fetching NASA NeoWs data for ${today} to ${tomorrow}...`);
    
    const response = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${tomorrow}&api_key=${process.env.NEXT_PUBLIC_NASA_API_KEY || "DEMO_KEY"}`
    );
    
    if (!response.ok) {
      throw new Error(`NASA API ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    fs.writeFileSync('./nasa_data.json', JSON.stringify(data, null, 2));
    console.log('Successfully saved to ./nasa_data.json');
  } catch (err) {
    console.error('Failed to fetch:', err);
  }
}

fetchAsteroids();
