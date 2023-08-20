import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import L from 'leaflet'; // Import Leaflet library
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
      console.log("clicked")
      setSelectedLocations(...selectedLocations,details)
      const response = await fetch('/api/add_locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations: selectedLocations }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Response:', data);
        addresultmarker(data);
        resetMap();
      } else {
        console.error('Failed to submit locations:', response.statusText);
      }
      // Process response and update UI
    } catch (error) {
      console.error('Error sending data to Flask:', error);
    }
  };

  function addresultmarker(response) {
    finallocations = response['locations'];
    rank = response['rank'];

    for (let i = 0; i < finallocations.length; i++) {
        let marker = L.marker([finallocations[i]['lat'],finallocations[i]['lng']]).addTo(map);
        var j = rank[i];
        var i_ = i+1;
        var label = "Location <b>"+ i_ +"</b> <br> Ranked: <b>"+j+"</b>";
        marker.bindTooltip( label, {
            permanent: true, direction: 'right', 
            offset: [3, -3], className: "my-labels"
        });
    }
    var locationsListDiv = document.getElementById('locationsList');
    locationsListDiv.innerHTML = '<h3>Result</h3><p>As shown in the map the locations are sorted based on different factors. The location with Rank <b>1</b> is the best location among the choices you have shown, then Rank <b>2</b> and go on..</p>';

}
    
  const resetMap = () => {
    markers.forEach((marker) => map.removeLayer(marker));
    setMarkers([]);
    setSelectedLocations([]);
  };

  return (
    
    <div className="flex">
      <div id="map" className=" w-screen"></div>
    <div class="container">

      <div className="w-72 h-screen p-4 bg-gray">
        <div className="mb-4">
          <button
            className="button"
            onClick={onSubmitButtonClick}
            disabled={selectedLocations.length === 0}
          >
            Submit
          </button>
          <button className="button " onClick={resetMap}>
            Reset
          </button>
        </div>
        <div id="locationsList" className='mx-4'>
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
    </div>
  );
}

export default Map;
