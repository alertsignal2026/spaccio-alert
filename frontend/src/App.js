import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const CATEGORIE = [
  { id: 1, label: 'Spaccio droga', colore: '#e74c3c' },
  { id: 2, label: 'Parcheggiatori abusivi', colore: '#e67e22' },
  { id: 3, label: 'Punto di ritrovo sospetto', colore: '#f1c40f' },
  { id: 4, label: 'Comportamento aggressivo', colore: '#3498db' },
  { id: 5, label: 'Spaccio in edificio', colore: '#9b59b6' },
  { id: 6, label: 'Altra attivita sospetta', colore: '#1abc9c' },
];

function icona(colore) {
  return L.divIcon({
    className: '',
    html: '<div style="background:' + colore + ';width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function NuovaSegnalazione({ onSegnala }) {
  useMapEvents({
    click(e) {
      const scelta = prompt(
        'Seleziona categoria:\n1. Spaccio droga\n2. Parcheggiatori abusivi\n3. Punto di ritrovo sospetto\n4. Comportamento aggressivo\n5. Spaccio in edificio\n6. Altra attivita sospetta\n\nScrivi il numero:'
      );
      const cat = CATEGORIE.find(function(c) { return c.id === parseInt(scelta); });
      if (cat) onSegnala(e.latlng.lat, e.latlng.lng, cat.label);
    },
  });
  return null;
}

export default function App() {
  const [segnalazioni, setSegnalazioni] = useState([]);
  const [messaggio, setMessaggio] = useState('');

  function caricaSegnalazioni() {
    fetch('http://localhost:3000/segnalazioni')
      .then(function(r) { return r.json(); })
      .then(setSegnalazioni)
      .catch(console.error);
  }

  useEffect(function() {
    caricaSegnalazioni();
    const interval = setInterval(caricaSegnalazioni, 10000);
    return function() { clearInterval(interval); };
  }, []);

  function inviaSegnalazione(lat, lng, categoria) {
    fetch('http://localhost:3000/segnalazioni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitudine: lat, longitudine: lng, categoria: categoria, descrizione: '' }),
    }).then(function() {
      setMessaggio('Segnalazione inviata! Verra mostrata dopo 3 segnalazioni nella stessa zona.');
      setTimeout(function() { setMessaggio(''); }, 5000);
      caricaSegnalazioni();
    });
  }

  function condividi() {
    navigator.clipboard.writeText(window.location.href);
    setMessaggio('Link copiato! Condividilo con chi vuoi.');
    setTimeout(function() { setMessaggio(''); }, 3000);
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      <div style={{ background: '#12192c', padding: 0, lineHeight: 0 }}>
        <img
          src="/logo-banner.png"
          alt="SpaccioAlert"
          style={{ width: '100%', height: '120px', objectFit: 'contain', objectPosition: 'left center', background: '#12192c' }}
        />
      </div>

      <div style={{ background: '#c0392b', color: 'white', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 'bold' }}>
          Le segnalazioni sono completamente anonime — nessun dato personale viene raccolto
        </span>
        <button
          onClick={condividi}
          style={{ background: 'white', color: '#c0392b', border: 'none', padding: '6px 16px', borderRadius: 20, fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}
        >
          Condividi
        </button>
      </div>

      {messaggio !== '' && (
        <div style={{ background: '#27ae60', color: 'white', padding: '10px 20px', textAlign: 'center', fontWeight: 'bold' }}>
          {messaggio}
        </div>
      )}

      <MapContainer center={[41.8719, 12.5674]} zoom={6} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <NuovaSegnalazione onSegnala={inviaSegnalazione} />
        {segnalazioni.map(function(s) {
          const cat = CATEGORIE.find(function(c) { return c.label === s.categoria; }) || CATEGORIE[5];
          return (
            <Marker key={s.id} position={[parseFloat(s.latitudine), parseFloat(s.longitudine)]} icon={icona(cat.colore)}>
              <Popup>
                <strong>{s.categoria}</strong><br />
                {new Date(s.data_ora).toLocaleDateString('it-IT')}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div style={{ background: '#12192c', color: 'white', padding: '6px 20px', fontSize: 12, textAlign: 'center' }}>
        {segnalazioni.length} segnalazioni attive — VEDI. SEGNALA. CAMBIA.
      </div>

    </div>
  );
}