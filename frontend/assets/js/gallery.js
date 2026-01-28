// frontend/assets/js/gallery.js
document.addEventListener('DOMContentLoaded', () => {
  const gallery = new Gallery();
  gallery.initialize();
});

class Gallery {
  constructor() {
    this.items = [];
    this.filteredItems = [];
    this.currentIndex = 0;
    this.lightboxOpen = false;
  }

  initialize() {
    this.loadGalleryData();
    this.renderGallery();
    this.setupEventListeners();
  }

  loadGalleryData() {
    // Datos de la galería (en producción, estos vendrían de una API)
    this.items = [
      {
        id: 1,
        src: 'assets/images/gallery/field/mangrove-tumaco.jpg',
        thumbnail: 'assets/images/gallery/field/mangrove-tumaco-thumb.jpg',
        title: 'Manglar de Tumaco',
        description: 'Vista aérea del manglar donde se implementó el sistema de sensores',
        category: 'field',
        date: '2026-01-15',
        tags: ['campo', 'implementación', 'manglar']
      },
      {
        id: 2,
        src: 'assets/images/gallery/hardware/sensor-device.jpg',
        thumbnail: 'assets/images/gallery/hardware/sensor-device-thumb.jpg',
        title: 'Dispositivo M.A.N.G.O',
        description: 'Prototipo del dispositivo con sensores de pH, temperatura y turbidez',
        category: 'hardware',
        date: '2026-01-10',
        tags: ['hardware', 'sensores', 'prototipo']
      },
      {
        id: 3,
        src: 'assets/images/gallery/dashboard/dashboard-real.jpg',
        thumbnail: 'assets/images/gallery/dashboard/dashboard-real-thumb.jpg',
        title: 'Dashboard en Tiempo Real',
        description: 'Interfaz mostrando datos reales de los sensores en funcionamiento',
        category: 'dashboard',
        date: '2026-01-18',
        tags: ['dashboard', 'interfaz', 'datos']
      },
      {
        id: 4,
        src: 'assets/images/gallery/community/community-workshop.jpg',
        thumbnail: 'assets/images/gallery/community/community-workshop-thumb.jpg',
        title: 'Taller Comunitario',
        description: 'Capacitación a comunidad local en Buenaventura sobre el uso del sistema',
        category: 'community',
        date: '2026-01-05',
        tags: ['comunidad', 'capacitación', 'buenaventura']
      },
      {
        id: 5,
        src: 'assets/images/gallery/field/sensor-deployment.jpg',
        thumbnail: 'assets/images/gallery/field/sensor-deployment-thumb.jpg',
        title: 'Despliegue de Sensores',
        description: 'Instalación de sensores en el manglar durante la expedición',
        category: 'field',
        date: '2026-01-12',
        tags: ['campo', 'instalación', 'expedición']
      },
      {
        id: 6,
        src: 'assets/images/gallery/hardware/esp32-circuit.jpg',
        thumbnail: 'assets/images/gallery/hardware/esp32-circuit-thumb.jpg',
        title: 'Circuito ESP32',
        description: 'Diagrama del circuito electrónico con módulo LoRa y sensores',
        category: 'hardware',
        date: '2026-01-08',
        tags: ['hardware', 'circuito', 'esp32']
      },
      {
        id: 7,
        src: 'assets/images/gallery/documentation/schematic-diagram.jpg',
        thumbnail: 'assets/images/gallery/documentation/schematic-diagram-thumb.jpg',
        title: 'Diagrama Esquemático',
        description: 'Esquema completo del sistema de monitoreo',
        category: 'documentation',
        date: '2026-01-03',
        tags: ['documentación', 'esquema', 'diagrama']
      },
      {
        id: 8,
        src: 'assets/images/gallery/community/team-photo.jpg',
        thumbnail: 'assets/images/gallery/community/team-photo-thumb.jpg',
        title: 'Equipo de Trabajo',
        description: 'Equipo técnico durante la implementación en campo',
        category: 'community',
        date: '2026-01-20',
        tags: ['equipo', 'trabajo', 'campo']
      },
      {
        id: 9,
        src: 'assets/images/gallery/hardware/lora-module.jpg',
        thumbnail: 'assets/images/gallery/hardware/lora-module-thumb.jpg',
        title: 'Módulo LoRa',
        description: 'Módulo de comunicación LoRa para transmisión de datos',
        category: 'hardware',
        date: '2026-01-14',
        tags: ['hardware', 'comunicación', 'lora']
      },
      {
        id: 10,
        src: 'assets/images/gallery/field/testing-session.jpg',
        thumbnail: 'assets/images/gallery/field/testing-session-thumb.jpg',
        title: 'Sesión de Pruebas',
        description: 'Pruebas del sistema en condiciones reales de campo',
        category: 'field',
        date: '2026-01-22',
        tags: ['pruebas', 'campo', 'testing']
      }
    ];
    
    this.filteredItems = [...this.items];
  }

  renderGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';
    
    this.filteredItems.forEach(item => {
      const galleryItem = document.createElement('div');
      galleryItem.className = `gallery-item ${item.category}`;
      galleryItem.innerHTML = `
        <div class="gallery-item-content">
          <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
          <div class="gallery-overlay">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <span class="gallery-date">${this.formatDate(item.date)}</span>
          </div>
        </div>
      `;
      
      galleryItem.addEventListener('click', () => this.openLightbox(item.id));
      galleryGrid.appendChild(galleryItem);
    });
  }

  setupEventListeners() {
    // Filtros
    document.querySelectorAll('.gallery-filters button').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.gallery-filters button').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        
        const filter = button.dataset.filter;
        this.applyFilter(filter);
      });
    });

    // Lightbox
    document.getElementById('close-lightbox').addEventListener('click', () => this.closeLightbox());
    document.getElementById('lightbox-prev').addEventListener('click', () => this.showPrevious());
    document.getElementById('lightbox-next').addEventListener('click', () => this.showNext());

    // Teclas de navegación
    document.addEventListener('keydown', (e) => {
      if (this.lightboxOpen) {
        if (e.key === 'Escape') this.closeLightbox();
        if (e.key === 'ArrowLeft') this.showPrevious();
        if (e.key === 'ArrowRight') this.showNext();
      }
    });

    // Clic fuera del lightbox para cerrar
    document.getElementById('lightbox').addEventListener('click', (e) => {
      if (e.target === document.getElementById('lightbox')) {
        this.closeLightbox();
      }
    });
  }

  applyFilter(filter) {
    if (filter === 'all') {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(item => item.category === filter);
    }
    this.renderGallery();
  }

  openLightbox(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return;
    
    this.currentIndex = this.items.findIndex(i => i.id === itemId);
    this.lightboxOpen = true;
    
    document.getElementById('lightbox-img').src = item.src;
    document.getElementById('lightbox-caption').innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <span class="lightbox-date">${this.formatDate(item.date)}</span>
    `;
    
    document.getElementById('lightbox').style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.body.style.overflow = 'auto';
    this.lightboxOpen = false;
  }

  showPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.openLightbox(this.items[this.currentIndex].id);
    }
  }

  showNext() {
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
      this.openLightbox(this.items[this.currentIndex].id);
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}