// This is a placeholder - you'll need to implement this based on your actual polygon data
// This function should convert your database records into GeoJSON format

const generatePolygons = (data, type) => {
    // This is a simplified example - you'll need to adapt this to your actual data structure
    return data.map(item => {
      return {
        type: 'Feature',
        properties: {
          id: item._id,
          name: item.name,
          type: type,
          code: item.code || item.pcCode || item.dtCode || item.acNo,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [], // You'll need to populate this with actual coordinates
        },
      };
    });
  };
  
  module.exports = {
    generatePolygons,
  };