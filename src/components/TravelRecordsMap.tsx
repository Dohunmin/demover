import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TravelRecord {
  id: string;
  location_name: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  visit_date: string;
  memo?: string;
}

interface TravelRecordsMapProps {
  records: TravelRecord[];
  onRecordClick?: (record: TravelRecord) => void;
}

const TravelRecordsMap: React.FC<TravelRecordsMapProps> = ({ records, onRecordClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [needsToken, setNeedsToken] = useState(false);
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Check for Mapbox token on mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Try to get token from edge function or environment
        const response = await fetch('/api/mapbox-token');
        if (response.ok) {
          const data = await response.json();
          setMapboxToken(data.token);
        } else {
          setNeedsToken(true);
        }
      } catch (error) {
        setNeedsToken(true);
      }
    };
    
    checkToken();
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [127.9778, 37.5665], // Seoul coordinates as default
      zoom: 10,
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxToken]);

  // Add markers for travel records
  useEffect(() => {
    if (!map.current || !records.length) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const validRecords = records.filter(record => 
      record.latitude && record.longitude
    );

    if (validRecords.length === 0) return;

    // Add markers for each record
    validRecords.forEach(record => {
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.innerHTML = `
        <div style="
          background-color: #000000;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          border: 2px solid white;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `;

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([record.longitude!, record.latitude!])
        .addTo(map.current!);

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #222;">${record.location_name}</h3>
            ${record.location_address ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${record.location_address}</p>` : ''}
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">방문일: ${new Date(record.visit_date).toLocaleDateString('ko-KR')}</p>
            ${record.memo ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #444;">${record.memo}</p>` : ''}
          </div>
        `);

      // Add click event
      markerElement.addEventListener('click', () => {
        if (onRecordClick) {
          onRecordClick(record);
        }
      });

      marker.setPopup(popup);
      markers.current.push(marker);
    });

    // Fit map to show all markers
    if (validRecords.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      validRecords.forEach(record => {
        bounds.extend([record.longitude!, record.latitude!]);
      });
      
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 }
      });
    } else if (validRecords.length === 1) {
      const record = validRecords[0];
      map.current.setCenter([record.longitude!, record.latitude!]);
      map.current.setZoom(14);
    }
  }, [records, onRecordClick]);

  if (needsToken) {
    return (
      <div className="p-6 text-center bg-muted rounded-lg">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Mapbox 토큰이 필요합니다</h3>
        <p className="text-sm text-muted-foreground mb-4">
          지도를 표시하려면 Mapbox 토큰을 입력해주세요.<br />
          <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            mapbox.com
          </a>에서 토큰을 발급받을 수 있습니다.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Mapbox 토큰을 입력하세요"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            type="password"
          />
          <Button 
            onClick={() => setNeedsToken(false)}
            disabled={!mapboxToken.trim()}
            className="button-primary"
          >
            적용
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-md">
      <div ref={mapContainer} className="absolute inset-0" />
      {records.filter(r => r.latitude && r.longitude).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              위치 정보가 있는 여행 기록이 없습니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelRecordsMap;