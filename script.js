let map = L.map('map', { zoomControl: false }).setView([-6.9147, 107.6098], 11);

// Tile peta standar
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('openSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
const kategoriSelect = document.getElementById('kategori');
const searchInput = document.getElementById('search');
const totalInfo = document.getElementById('totalInfo');
const daftarRS = document.createElement('div');
daftarRS.id = "daftarRS";
sidebar.appendChild(daftarRS);

let markersLayer = L.layerGroup().addTo(map);
let routingControl = null;

// Tombol buka sidebar
openSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('closed');
  openSidebarBtn.style.display = 'none'; // sembunyikan garis tiga
});

// Tombol tutup sidebar
closeSidebarBtn.addEventListener('click', () => {
  sidebar.classList.add('closed');
  openSidebarBtn.style.display = 'block'; // tampilkan garis tiga lagi
});

function tampilkanMarker(data) {
  markersLayer.clearLayers();
  daftarRS.innerHTML = "";
  const kategoriSet = new Set();

  data.forEach(rs => {
    const { nama, alamat, kategori, koordinat } = rs;
    kategoriSet.add(kategori);

    const marker = L.marker([koordinat[0], koordinat[1]]).addTo(markersLayer);
    marker.bindPopup(`
      <b>${nama}</b><br>
      ${alamat}<br>
      <i>${kategori}</i><br><br>
      <button onclick="lihatArah(${koordinat[0]}, ${koordinat[1]})">Lihat Arah</button>
    `);

    const item = document.createElement("div");
    item.className = "rs-item";
    item.innerHTML = `<b>${nama}</b><br><small>${kategori}</small>`;
    item.addEventListener("click", () => {
      map.setView([koordinat[0], koordinat[1]], 15);
      marker.openPopup();
    });
    daftarRS.appendChild(item);
  });

  // isi kategori dropdown
  if (kategoriSelect.options.length <= 1) {
    kategoriSelect.innerHTML = '<option value="all">Semua Kategori</option>';
    [...kategoriSet].sort().forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      kategoriSelect.appendChild(opt);
    });
  }

  totalInfo.textContent = `Menampilkan ${data.length} Rumah Sakit`;
}

// lihat arah otomatis
function lihatArah(lat, lng) {
  if (routingControl) {
    map.removeControl(routingControl);
  }

  if (!navigator.geolocation) {
    alert("Browser tidak mendukung geolocation!");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      routingControl = L.Routing.control({
        waypoints: [
          L.latLng(userLat, userLng),
          L.latLng(lat, lng)
        ],
        routeWhileDragging: false,
        show: true,
        lineOptions: { styles: [{ color: "#007bff", weight: 5 }] },
        createMarker: (i, wp) => {
          return L.marker(wp.latLng, {
            icon: L.icon({
              iconUrl: i === 0
                ? "https://cdn-icons-png.flaticon.com/512/149/149060.png"
                : "https://cdn-icons-png.flaticon.com/512/684/684908.png",
              iconSize: [30, 30]
            })
          });
        },
        language: "id",
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1"
        })
      }).addTo(map);

      // langsung munculin jalur
      routingControl.on('routesfound', e => {
        map.fitBounds(L.latLngBounds([ [userLat, userLng], [lat, lng] ]));
      });
    },
    err => {
      alert("Tidak dapat mengakses lokasi Anda. Pastikan GPS aktif dan izinkan lokasi di browser.");
    }
  );
}

function filterData() {
  const kategori = kategoriSelect.value;
  const search = searchInput.value.toLowerCase();

  const filtered = rumahSakitData.filter(rs => {
    const cocokKategori = kategori === "all" || rs.kategori === kategori;
    const cocokSearch = rs.nama.toLowerCase().includes(search);
    return cocokKategori && cocokSearch;
  });

  tampilkanMarker(filtered);
}

searchInput.addEventListener('input', filterData);
kategoriSelect.addEventListener('change', filterData);

tampilkanMarker(rumahSakitData);
