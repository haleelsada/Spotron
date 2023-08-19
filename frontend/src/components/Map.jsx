import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import L from 'leaflet'; // Import Leaflet library
import axios from 'axios'; // You'll need to install axios for API requests
import './Map.css'

function Map() {
  const [map, setMap] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [details, setDetails] = useState({
    cname: localStorage.getItem('company_name'),
    ctype: localStorage.getItem('Company_Type'),
    cloc: localStorage.getItem('Company_location'),
    ctar: localStorage.getItem('Company_target'),
  });

  useEffect(() => {
    // Initialize map
    const newMap = L.map('map').setView([15, 77], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(newMap);
    setMap(newMap);
  }, []);

  useEffect(() => {
    // Attach click event to map
    if (map) {
      map.on('click', onMapClick);
    }
  }, [map]);

  const onMapClick = (e) => {
    // Handle map click event
    const clickedLat = e.latlng.lat;
    const clickedLng = e.latlng.lng;

    const stepIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png',
      iconSize: [30, 30],
    });

    const marker = L.marker([clickedLat, clickedLng], { icon: stepIcon });
    marker.addTo(map);

    setMarkers((prevMarkers) => [...prevMarkers, marker]);

    const locationDetails = { lat: clickedLat, lng: clickedLng };
    setSelectedLocations((prevLocations) => [...prevLocations, locationDetails]);
  };

  const deleteLocation = (index) => {
    const newMarkers = [...markers];
    const marker = newMarkers[index];
    map.removeLayer(marker);
    newMarkers.splice(index, 1);
    setMarkers(newMarkers);

    const newLocations = [...selectedLocations];
    newLocations.splice(index, 1);
    setSelectedLocations(newLocations);
  };

  const onSubmitButtonClick = async () => {
    try {
      const response = await axios.post('/api/add_locations', {
        locations: selectedLocations,
      });
      // Process response and update UI
    } catch (error) {
      console.error('Error sending data to Flask:', error);
    }
  };

  const resetMap = () => {
    markers.forEach((marker) => map.removeLayer(marker));
    setMarkers([]);
    setSelectedLocations([]);
  };

  return (
    <div className="flex">
      <div id="map" className="h-screen w-screen"></div>
      <div className="w-72 h-screen p-4 bg-gray-100">
        <div className="mb-4">
          <button
            className="button"
            onClick={onSubmitButtonClick}
            disabled={selectedLocations.length === 0}
          >
            Submit
          </button>
          <button className="button" onClick={resetMap}>
            Reset
          </button>
        </div>
        <div id="locationsList">
  <h2 className="text-xl font-semibold mb-2">Selected Locations</h2>
  {selectedLocations.map((location, index) => (
    <div key={index} className="border-b pb-2 mb-2">
      <p className="text-sm">
        <span className="font-semibold">Location {index + 1}:</span>
        <br />
        Latitude: {location.lat}
        <br />
        Longitude: {location.lng}
      </p>
      <button
        className="button mt-2"
        onClick={() => deleteLocation(index)}
      >
        Delete
      </button>
    </div>
  ))}
</div>

      </div>
    </div>
  );
}

export default Map;
