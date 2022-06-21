import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Subject } from "rxjs";
import { v4 } from "uuid";

mapboxgl.accessToken =
  "pk.eyJ1IjoidGVra2EtYXJnIiwiYSI6ImNsNG5mYXczMDA5aGgzZW1ya24xN29yOHkifQ.1yBZeZozYRftzSC4KXxZeA";

export const useMapbox = (puntoInicial) => {
  //Referencia al DIV del mapa
  const setRef = useCallback((node) => {
    mapaDiv.current = node;
  }, []);
  const mapaDiv = useRef();

  //Referencia a los marcadores
  const marcadores = useRef({});

  //Observables de RXJS
  const movimientoMarcador = useRef(new Subject());
  const nuevoMarcador = useRef(new Subject());

  //Mapa y coords
  const mapa = useRef();
  const [coords, setCoords] = useState(puntoInicial);

  //Funcion para agregar marcadores
  const agregarMarcador = useCallback((ev, id) => {
    const { lng, lat } = ev.lngLat || ev;
    const marker = new mapboxgl.Marker();
    marker.id = id ?? v4();
    marker.setLngLat([lng, lat]).addTo(mapa.current).setDraggable(true);
    marcadores.current[marker.id] = marker;

    if (!id) {
      nuevoMarcador.current.next({ id: marker.id, lng, lat });
    }

    //Escuchar movimientos del marcador
    marker.on("drag", ({ target }) => {
      const id = target.id;
      const { lng, lat } = target.getLngLat();

      //emitir los cambios del marcador
      movimientoMarcador.current.next({ id, lng, lat });
    });
  }, []);

  //Actualizar la posicion del marcador
  const actualizarPosicion = useCallback(({ id, lng, lat }) => {
    marcadores.current[id].setLngLat([lng, lat]);
  }, []);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapaDiv.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [puntoInicial.lng, puntoInicial.lat],
      zoom: puntoInicial.zoom,
    });
    mapa.current = map;
  }, [puntoInicial]);

  //Cuando se mueve el mapa
  useEffect(() => {
    mapa.current?.on("move", () => {
      const { lng, lat } = mapa.current?.getCenter();
      setCoords({
        lng: lng.toFixed(4),
        lat: lat.toFixed(4),
        zoom: mapa.current?.getZoom().toFixed(2),
      });
    });
  }, []);

  //Agregar marcadores cuando hago click
  useEffect(() => {
    mapa.current?.on("click", agregarMarcador);
  }, [agregarMarcador]);

  return {
    coords,
    setRef,
    marcadores,
    agregarMarcador,
    nuevoMarcador$: nuevoMarcador.current,
    movimientoMarcador$: movimientoMarcador.current,
    actualizarPosicion,
  };
};
