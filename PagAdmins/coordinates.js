class CoordinatesManager {
  constructor() {
    this.marcadores = [];
    this.coordenadasSeleccionadas = new Map();
    this.map = null;
  }

  setMap(map) {
    this.map = map;
  }

  limpiarMarcadores() {
    this.marcadores.forEach(m => m.marker.remove());
    this.marcadores.length = 0;
    this.coordenadasSeleccionadas.clear();
    document.getElementById("saveButton").disabled = true;
  }

  generarCoordenadas() {
    this.limpiarMarcadores();
    const salida = [];

    for (let i = 0; i < 6; i++) {
      const zona = ZONAS[Math.floor(Math.random() * ZONAS.length)];
      const lons = zona.map(p => p[0]);
      const lats = zona.map(p => p[1]);
      const lon = Math.min(...lons) + Math.random() * (Math.max(...lons) - Math.min(...lons));
      const lat = Math.min(...lats) + Math.random() * (Math.max(...lats) - Math.min(...lats));

      const el = document.createElement("div");
      el.className = "marker-label";
      el.textContent = i + 1;

      const marker = new mapboxgl.Marker(el).setLngLat([lon, lat]).addTo(this.map);
      el.addEventListener("click", () => {
        el.classList.toggle("selected");
        const id = i + 1;
        if (el.classList.contains("selected")) {
          this.coordenadasSeleccionadas.set(id, { id, lat, lon });
        } else {
          this.coordenadasSeleccionadas.delete(id);
        }
        document.getElementById("saveButton").disabled = this.coordenadasSeleccionadas.size === 0;
      });

      this.marcadores.push({ marker, element: el, coords: { lat, lon } });
      salida.push(`#${i + 1}: Lat ${lat.toFixed(5)}, Lon ${lon.toFixed(5)}`);
    }

    document.getElementById("output").textContent = salida.join("\n");
  }

  async guardarCoordenadas() {
    try {
      const coordsToSave = Array.from(this.coordenadasSeleccionadas.values()).map(coord => ({
        Latitud: coord.lat,
        Longitud: coord.lon,
        Fecha: new Date().toISOString()
      }));

      const { error } = await supabase.from("Coordenadas").insert(coordsToSave);
      if (error) {
        alert("Error al guardar: " + error.message);
      } else {
        alert("Coordenadas guardadas correctamente.");
        this.marcadores.forEach(m => m.element.classList.remove("selected"));
        this.coordenadasSeleccionadas.clear();
        document.getElementById("saveButton").disabled = true;
      }
    } catch (error) {
      alert("Error al guardar las coordenadas: " + error.message);
    }
  }

  async cargarCoordenadasEnTabla() {
    try {
      const { data, error } = await client
        .from("Coordenadas")
        .select("*")
        .order("Fecha", { ascending: false });

      if (error) {
        alert("Error al cargar coordenadas: " + error.message);
        return;
      }

      const tableBody = document.getElementById("tableBody");
      tableBody.innerHTML = "";

      if (data && data.length > 0) {
        data.forEach((coord, index) => {
          const row = document.createElement("tr");
          const fecha = new Date(coord.Fecha).toLocaleString("es-ES");
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${coord.Latitud.toFixed(5)}</td>
            <td>${coord.Longitud.toFixed(5)}</td>
            <td>${fecha}</td>
          `;
          tableBody.appendChild(row);
        });
      } else {
        const row = document.createElement("tr");
        row.innerHTML = '<td colspan="4" style="text-align: center; color: #999;">No hay coordenadas guardadas</td>';
        tableBody.appendChild(row);
      }

      const modal = document.getElementById("coordinatesModal");
      modal.classList.add("show");
      document.getElementById("dropdownMenu").classList.remove("show");
    } catch (error) {
      alert("Error al cargar las coordenadas: " + error.message);
    }
  }

  async exportarExcel() {
    try {
      const { data, error } = await client
        .from("Coordenadas")
        .select("*")
        .order("Fecha", { ascending: false });

      if (error) {
        alert("Error al cargar coordenadas: " + error.message);
        return;
      }

      if (!data || data.length === 0) {
        alert("No hay coordenadas para exportar");
        return;
      }

      // Crear CSV
      let csv = "Latitud,Longitud,Fecha\n";
      data.forEach(coord => {
        const fecha = new Date(coord.Fecha).toLocaleString("es-ES");
        csv += `${coord.Latitud},${coord.Longitud},"${fecha}"\n`;
      });

      // Descargar CSV
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `coordenadas_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("Coordenadas exportadas correctamente");
      document.getElementById("dropdownMenu").classList.remove("show");
    } catch (error) {
      alert("Error al exportar las coordenadas: " + error.message);
    }
  }

  // Cargar coordenadas en la tabla del modal
  async cargarCoordenadas() {
    try {
      console.log('Cargando coordenadas del modal...');
      
      if (!supabase) {
        console.error('Supabase no está inicializado');
        return;
      }

      const { data, error } = await supabase
        .from('Coordenadas')
        .select('*')
        .order('Fecha', { ascending: false });

      if (error) {
        console.error('Error al cargar coordenadas:', error);
        throw error;
      }

      console.log('Coordenadas obtenidas:', data);

      // Llenar tabla
      const tableBody = document.getElementById('tableBody');
      tableBody.innerHTML = ''; // Limpiar tabla

      if (data && data.length > 0) {
        data.forEach((coord, index) => {
          const row = document.createElement('tr');
          row.dataset.coordinateId = coord.id;

          const checkboxCell = document.createElement('td');
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkboxCell.appendChild(checkbox);

          const numCell = document.createElement('td');
          numCell.textContent = coord.id;

          // Validar que existan las propiedades antes de acceder
          const latitud = coord.Latitud || coord.latitud || 0;
          const longitud = coord.Longitud || coord.longitud || 0;
          const fecha = coord.Fecha || coord.fecha_creacion || new Date().toISOString();

          const latCell = document.createElement('td');
          latCell.textContent = typeof latitud === 'number' ? latitud.toFixed(6) : latitud;

          const lngCell = document.createElement('td');
          lngCell.textContent = typeof longitud === 'number' ? longitud.toFixed(6) : longitud;

          const dateCell = document.createElement('td');
          dateCell.textContent = new Date(fecha).toLocaleDateString('es-ES');

          row.appendChild(checkboxCell);
          row.appendChild(numCell);
          row.appendChild(latCell);
          row.appendChild(lngCell);
          row.appendChild(dateCell);

          tableBody.appendChild(row);
        });
      } else {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.textContent = 'No hay coordenadas guardadas';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        tableBody.appendChild(row);
      }
    } catch (error) {
      console.error('Error al cargar coordenadas:', error);
      alert('Error al cargar coordenadas: ' + error.message);
    }
  }

  // Guardar coordenadas en Supabase
  async guardarCoordenadasEnSupabase(coordenadas) {
    try {
      console.log('Intentando guardar coordenadas:', coordenadas);
      
      if (!supabase) {
        console.error('Supabase no está inicializado');
        alert('Error: Supabase no disponible');
        return false;
      }

      if (!coordenadas || coordenadas.length === 0) {
        alert('No hay coordenadas para guardar');
        return false;
      }

      // Preparar datos para insertar
      const datosGuardar = coordenadas.map(coord => ({
        latitud: coord.lat,
        longitud: coord.lng,
        fecha_creacion: new Date().toISOString()
      }));

      console.log('Datos a guardar:', datosGuardar);

      const { data, error } = await supabase
        .from('Coordenadas')
        .insert(datosGuardar)
        .select();

      if (error) {
        console.error('Error al guardar en Supabase:', error);
        throw error;
      }

      console.log('Coordenadas guardadas exitosamente:', data);
      alert('Coordenadas guardadas exitosamente');
      return true;
    } catch (error) {
      console.error('Error al guardar las coordenadas:', error);
      alert('Error al guardar las coordenadas: ' + error.message);
      return false;
    }
  }
}

const coordinatesManager = new CoordinatesManager();
window.cargarCoordenadas = () => coordinatesManager.cargarCoordenadas();

