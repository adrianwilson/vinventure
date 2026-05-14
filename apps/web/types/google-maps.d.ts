declare namespace google.maps {
  class Map {
    constructor(element: HTMLElement, options?: MapOptions);
    panTo(latLng: LatLngLiteral): void;
    setZoom(zoom: number): void;
  }

  class Marker {
    constructor(options?: MarkerOptions);
    setMap(map: Map | null): void;
    getTitle(): string | undefined;
    addListener(event: string, handler: () => void): void;
  }

  class InfoWindow {
    constructor(options?: InfoWindowOptions);
    open(map?: Map, anchor?: Marker): void;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  namespace event {
    function trigger(instance: object, event: string): void;
  }

  interface MapOptions {
    zoom?: number;
    center?: LatLngLiteral;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    zoomControl?: boolean;
    styles?: MapTypeStyle[];
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface MarkerOptions {
    position?: LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Icon;
  }

  interface Icon {
    url: string;
    scaledSize?: Size;
    anchor?: Point;
  }

  interface InfoWindowOptions {
    content?: string;
  }

  interface MapTypeStyle {
    featureType?: string;
    elementType?: string;
    stylers?: object[];
  }
}

interface Window {
  google?: typeof google;
}
