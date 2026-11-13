/**
 * ============================================================================
 * TEMPLE ATLAS - JAVASCRIPT APPLICATION LOGIC
 * ============================================================================
 * Pure vanilla JavaScript (ES6+) powering an interactive, modern world atlas
 * of sacred Hindu temples. Features prominent centering on India on page load,
 * responsive navigation, and smooth multi-device interactions.
 * ============================================================================
 */

(function () {
  'use strict';

  // --- GEOGRAPHICAL CONSTANTS ---
  // Centering coordinates and bounding box to frame India prominently on load
  const INDIA_CENTER = [22.2, 79.2];
  const INDIA_ZOOM_DESKTOP = 4.8;
  const INDIA_ZOOM_MOBILE = 4.0;
  const INDIA_BOUNDS = [
    [7.5, 68.0],   // Southwest corner (South India & Arabian Sea)
    [35.5, 96.0]   // Northeast corner (Himalayas & Northeast India)
  ];

  // --- APPLICATION STATE ---
  let map = null;                          // Leaflet map instance
  let allTemples = [];                     // Master array of temples loaded from JSON
  let currentlyFilteredTemples = [];       // Temples matching current search/filter
  let markerMap = new Map();               // temple.id -> L.Marker
  let currentActiveTempleId = null;        // ID of currently inspected temple
  let hoverCloseTimer = null;              // Timer handle for desktop hover pop-up delay
  let isHoveringPopup = false;             // Flag tracking cursor over pop-up
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;

  // --- DOM ELEMENT REFERENCES ---
  const mapElement = document.getElementById('map');
  const mapLoader = document.getElementById('map-loader');
  const searchInput = document.getElementById('search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const regionFilter = document.getElementById('region-filter');
  const btnResetView = document.getElementById('btn-reset-view');
  const btnToggleList = document.getElementById('btn-toggle-list');
  const regionChips = document.querySelectorAll('.chip');

  // Details Panel Elements
  const detailsPanel = document.getElementById('details-panel');
  const panelBackdrop = document.getElementById('panel-backdrop');
  const btnCloseDetails = document.getElementById('btn-close-details');
  const btnPrevTemple = document.getElementById('btn-prev-temple');
  const btnNextTemple = document.getElementById('btn-next-temple');
  const detailRegionTag = document.getElementById('detail-region-tag');
  const detailsIndexPill = document.getElementById('details-index-pill');
  const detailTempleName = document.getElementById('detail-temple-name');
  const detailCityCountry = document.getElementById('detail-city-country');
  const detailImage = document.getElementById('detail-image');
  const imageFallback = document.getElementById('image-fallback');
  const detailImageCredit = document.getElementById('detail-image-credit');
  const imageOverlayBadge = document.getElementById('image-overlay-badge');
  const detailSummary = document.getElementById('detail-summary');
  const detailHistory = document.getElementById('detail-history');
  const detailArchitecture = document.getElementById('detail-architecture');
  const detailLocation = document.getElementById('detail-location');
  const detailSignificance = document.getElementById('detail-significance');
  const detailFestivals = document.getElementById('detail-festivals');
  const btnZoomToActive = document.getElementById('btn-zoom-to-active');
  const btnShareTemple = document.getElementById('btn-share-temple');
  const linkOsmExternal = document.getElementById('link-osm-external');
  const linkFullImage = document.getElementById('link-full-image');

  // Directory Drawer Elements
  const listDrawer = document.getElementById('list-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerSearchInput = document.getElementById('drawer-search-input');
  const templeListContainer = document.getElementById('temple-list-container');

  // Mobile FAB Elements
  const mobileBtnDirectory = document.getElementById('mobile-btn-directory');
  const mobileBtnReset = document.getElementById('mobile-btn-reset');

  // Toast Notification Elements
  const errorToast = document.getElementById('error-toast');
  const toastIcon = document.getElementById('toast-icon');
  const errorToastText = document.getElementById('error-toast-text');
  const btnDismissToast = document.getElementById('btn-dismiss-toast');
  let toastTimeout = null;

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadTempleData();
    setupEventListeners();
    registerServiceWorker();
  });

  /**
   * Registers Progressive Web App (PWA) Service Worker for offline asset caching.
   */
  function registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then((registration) => {
          console.log('Temple Atlas Service Worker registered with scope:', registration.scope);
        }).catch((error) => {
          console.warn('Service Worker registration skipped or failed:', error);
        });
      });
    }
  }

  /**
   * Initializes the Leaflet map centered prominently on India.
   * Configures global bounds, minimum zoom, and OpenStreetMap tiles.
   */
  function initMap() {
    const isMobile = window.innerWidth <= 768;
    const initialZoom = isMobile ? INDIA_ZOOM_MOBILE : INDIA_ZOOM_DESKTOP;

    map = L.map('map', {
      center: INDIA_CENTER,
      zoom: initialZoom,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
      zoomControl: true,
      fadeAnimation: true,
      zoomAnimation: true
    });

    // Add OpenStreetMap tile layer with attribution in map corner
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Hide loader once map tiles finish initial rendering
    map.whenReady(() => {
      if (mapLoader) {
        mapLoader.style.opacity = '0';
        setTimeout(() => {
          mapLoader.style.display = 'none';
        }, 300);
      }
    });

    // Close open popups when clicking blank map space
    map.on('click', () => {
      clearHoverTimer();
    });
  }

  /**
   * Prominently centers and frames the map on India.
   * Automatically calculates optimal bounds based on device viewport.
   * 
   * @param {boolean} animate - Whether to animate smoothly
   */
  function centerOnIndia(animate = false) {
    if (!map) return;
    const isMobile = window.innerWidth <= 768;
    const bounds = L.latLngBounds(INDIA_BOUNDS);

    if (animate) {
      map.flyToBounds(bounds, {
        padding: isMobile ? [20, 20] : [50, 50],
        maxZoom: 6,
        duration: 1.2
      });
    } else {
      map.fitBounds(bounds, {
        padding: isMobile ? [20, 20] : [50, 50],
        maxZoom: 6
      });
    }
  }

  /**
   * Creates a custom SVG Leaflet DivIcon for a temple marker.
   * Features a majestic imperial maroon & radiant gold teardrop pin with
   * an ornate tiered Hindu temple shikhara, kalasha, and glowing inner sanctum.
   * 
   * @param {string} templeId - Unique temple identifier
   * @returns {L.DivIcon} Leaflet DivIcon instance
   */
  function createTempleIcon(templeId) {
    const iconHtml = `
      <div class="temple-pin" id="pin-${templeId}" role="button" aria-label="Temple marker">
        <svg viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pinBodyGrad-${templeId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4a0e19" />
              <stop offset="50%" stop-color="#2d050c" />
              <stop offset="100%" stop-color="#160205" />
            </linearGradient>
            <linearGradient id="pinGoldGrad-${templeId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fae08c" />
              <stop offset="50%" stop-color="#d4af37" />
              <stop offset="100%" stop-color="#a47d1e" />
            </linearGradient>
            <radialGradient id="pinHaloGrad-${templeId}" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ff7b1a" />
              <stop offset="70%" stop-color="#c94206" />
              <stop offset="100%" stop-color="#731f03" />
            </radialGradient>
          </defs>

          <!-- Outer Teardrop Pin Silhouette -->
          <path d="M20 1.5 C10 1.5 2 9.5 2 19.5 C2 31.5 18.2 47.8 19.3 48.9 C19.7 49.3 20.3 49.3 20.7 48.9 C21.8 47.8 38 31.5 38 19.5 C38 9.5 30 1.5 20 1.5 Z" 
                fill="url(#pinBodyGrad-${templeId})" 
                stroke="url(#pinGoldGrad-${templeId})" 
                stroke-width="1.8" />

          <!-- Inner Radiant Medallion -->
          <circle cx="20" cy="19" r="14.5" fill="url(#pinHaloGrad-${templeId})" stroke="#ffd56b" stroke-width="1" />

          <!-- Sacred Hindu Temple Motif Inside Marker -->
          <!-- Kalasha & Pinnacle Spire -->
          <path d="M20 7.5 L21 9.5 L20 10.2 L19 9.5 Z" fill="#ffffff" />
          <circle cx="20" cy="10.8" r="1" fill="#ffe082" />
          <!-- Amalaka Cap Disc -->
          <ellipse cx="20" cy="12.3" rx="3.4" ry="0.9" fill="#ffd56b" stroke="#6b4c09" stroke-width="0.4" />
          <!-- Shikhara Upper Tier -->
          <path d="M18.2 13 L21.8 13 L22.6 15.5 L17.4 15.5 Z" fill="#fff9f0" />
          <!-- Shikhara Middle Tier -->
          <path d="M16.8 16 L23.2 16 L24.2 19 L15.8 19 Z" fill="#fff9f0" />
          <circle cx="20" cy="17.5" r="0.75" fill="#380a12" />
          <!-- Mandapa Roof & Eaves -->
          <path d="M14.2 19.5 L25.8 19.5 L26.8 21 L13.2 21 Z" fill="#ffd56b" />
          <!-- Sanctum Pillars & Garbhagriha Arch -->
          <rect x="14.8" y="21.5" width="10.4" height="6.2" fill="#fff9f0" />
          <line x1="16" y1="21.5" x2="16" y2="27.7" stroke="#785510" stroke-width="0.6" />
          <line x1="24" y1="21.5" x2="24" y2="27.7" stroke="#785510" stroke-width="0.6" />
          <!-- Arched Portal -->
          <path d="M18 27.7 V24 Q20 22.8 22 24 V27.7 Z" fill="#24040a" />
          <!-- Sacred Diya Glow inside Sanctum -->
          <circle cx="20" cy="26" r="1.1" fill="#ff9933" />
          <circle cx="20" cy="25.8" r="0.5" fill="#ffffff" />
          <!-- Adhisthana Plinth -->
          <rect x="13.2" y="27.8" width="13.6" height="1.4" fill="#ffd56b" />
        </svg>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'temple-marker-icon',
      iconSize: [40, 50],
      iconAnchor: [20, 50],     // Tip of pin sits precisely on coordinate
      popupAnchor: [0, -48]     // Popup opens cleanly above pin
    });
  }

  /**
   * Fetches temple data asynchronously from temples.json.
   * Automatically displays India prominently at the center of the homepage.
   */
  async function loadTempleData() {
    try {
      const response = await fetch('temples.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      allTemples = data;
      currentlyFilteredTemples = [...allTemples];

      // Render all temple markers on the map
      renderMarkers(allTemples);
      renderDirectoryList(allTemples);

      // Display India prominently at the center on initial homepage load
      if (!window.location.hash) {
        centerOnIndia(false);
      } else {
        // If loaded with a specific URL hash (e.g. #angkor-wat), open that temple
        checkUrlHash();
      }
    } catch (err) {
      console.error('Failed to load temple data:', err);
      showToast(
        'Could not load temple data from temples.json. If running locally, please start a local server (e.g. "python3 -m http.server") due to browser security restrictions on file:// paths.',
        '⚠️',
        10000
      );
      if (mapLoader) {
        mapLoader.innerHTML = '<p style="color:#b33e06;font-weight:700;">⚠️ Could not load temples.json<br><small style="color:var(--text-secondary);font-weight:400;">Requires local or hosted web server</small></p>';
      }
    }
  }

  /**
   * Renders markers for the given list of temples on the Leaflet map.
   * Configures smart hover behavior for desktop and touch tap behavior for mobile.
   * 
   * @param {Array} temples - Array of temple objects
   */
  function renderMarkers(temples) {
    // Clear previous markers
    markerMap.forEach(marker => marker.remove());
    markerMap.clear();

    temples.forEach(temple => {
      const customIcon = createTempleIcon(temple.id);
      const marker = L.marker([temple.latitude, temple.longitude], {
        icon: customIcon,
        title: temple.name,
        alt: temple.name
      });

      // Construct High-End Pop-up Content with Image Preview Banner
      const popupContent = `
        <article class="popup-card">
          <div class="popup-image-banner">
            <img class="popup-thumb" src="${escapeHtml(temple.imageUrl)}" alt="${escapeHtml(temple.name)}" loading="lazy" referrerpolicy="no-referrer">
            <span class="popup-tag">${escapeHtml(temple.region || 'Sacred Site')}</span>
          </div>
          <div class="popup-body">
            <h3 class="popup-title">${escapeHtml(temple.name)}</h3>
            <div class="popup-location">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${escapeHtml(temple.city)}, ${escapeHtml(temple.country)}</span>
            </div>
            <p class="popup-summary">${escapeHtml(temple.summary)}</p>
            <button type="button" class="btn btn-primary popup-btn" onclick="window.TempleAtlas.openDetails('${escapeHtml(temple.id)}')">
              Explore Details &rarr;
            </button>
          </div>
        </article>
      `;

      // Bind the popup to the marker
      const popup = L.popup({
        offset: [0, -40],
        closeButton: true,
        autoPan: true,
        autoPanPadding: [40, 40]
      }).setContent(popupContent);

      marker.bindPopup(popup);

      // --- MOUSE & TOUCH EVENT BINDINGS ---
      if (!isTouchDevice) {
        // DESKTOP: Smooth Hover Preview
        marker.on('mouseover', () => {
          clearHoverTimer();
          marker.openPopup();

          // When popup DOM exists, attach hover tracking
          setTimeout(() => {
            const popupElement = popup.getElement();
            if (popupElement && !popupElement.dataset.hoverAttached) {
              popupElement.dataset.hoverAttached = 'true';

              // Cursor entered the popup: keep it open
              popupElement.addEventListener('mouseenter', () => {
                isHoveringPopup = true;
                clearHoverTimer();
              });

              // Cursor left the popup: start countdown to close
              popupElement.addEventListener('mouseleave', () => {
                isHoveringPopup = false;
                startHoverCloseTimer(popup);
              });
            }
          }, 50);
        });

        // When mouse leaves marker, start countdown
        marker.on('mouseout', () => {
          if (!isHoveringPopup) {
            startHoverCloseTimer(popup);
          }
        });
      }

      // CLICK / TAP: Opens popup permanently and centers smoothly
      marker.on('click', () => {
        clearHoverTimer();
        marker.openPopup();
      });

      marker.addTo(map);
      markerMap.set(temple.id, marker);
    });
  }

  /**
   * Starts a graceful delay timer before closing a hover pop-up.
   * Provides 400ms so users can comfortably move mouse onto "Explore Details".
   */
  function startHoverCloseTimer(popup) {
    clearHoverTimer();
    hoverCloseTimer = setTimeout(() => {
      if (!isHoveringPopup && map) {
        map.closePopup(popup);
      }
    }, 400);
  }

  /**
   * Clears any active pop-up hover close timer.
   */
  function clearHoverTimer() {
    if (hoverCloseTimer) {
      clearTimeout(hoverCloseTimer);
      hoverCloseTimer = null;
    }
  }

  /**
   * Opens the comprehensive Details Panel for a specific temple.
   * Populates history, architecture, location, significance, festivals, and image.
   * 
   * @param {string} templeId - Unique temple identifier
   * @param {boolean} updateHash - Whether to update browser URL hash
   */
  function openDetailsPanel(templeId, updateHash = true) {
    const templeIndex = allTemples.findIndex(t => t.id === templeId);
    if (templeIndex === -1) return;

    const temple = allTemples[templeIndex];
    currentActiveTempleId = templeId;
    clearHoverTimer();

    // Close any floating popup on map
    if (map) {
      map.closePopup();
    }

    // Update URL hash for bookmarking & direct sharing
    if (updateHash && window.location.hash !== `#${temple.id}`) {
      history.replaceState(null, '', `#${temple.id}`);
    }

    // Populate header tags & index counter
    detailRegionTag.textContent = temple.region || 'Sacred Temple';
    detailsIndexPill.textContent = `Temple ${templeIndex + 1} of ${allTemples.length}`;
    detailTempleName.textContent = temple.name;
    detailCityCountry.textContent = `${temple.city}, ${temple.country}`;

    // Narrative content
    detailSummary.textContent = temple.summary;
    detailHistory.textContent = temple.history;
    detailArchitecture.textContent = temple.architecture;
    detailLocation.textContent = temple.location;
    detailSignificance.textContent = temple.significance;

    // External OpenStreetMap link
    linkOsmExternal.href = `https://www.openstreetmap.org/?mlat=${temple.latitude}&mlon=${temple.longitude}#map=16/${temple.latitude}/${temple.longitude}`;

    // Populate Festivals as modern pill tags
    detailFestivals.innerHTML = '';
    if (Array.isArray(temple.festivals) && temple.festivals.length > 0) {
      temple.festivals.forEach(fest => {
        const li = document.createElement('li');
        li.textContent = fest;
        detailFestivals.appendChild(li);
      });
    }

    // Handle Image Loading with Skeleton, Full View link & Fallback
    const imageSkeleton = detailsPanel.querySelector('.image-skeleton');
    if (imageSkeleton) imageSkeleton.style.display = 'block';
    imageFallback.style.display = 'none';
    detailImage.style.display = 'block';
    detailImage.style.opacity = '1';

    detailImage.onload = () => {
      if (imageSkeleton) imageSkeleton.style.display = 'none';
      detailImage.style.display = 'block';
      detailImage.style.opacity = '1';
    };

    detailImage.onerror = () => {
      if (imageSkeleton) imageSkeleton.style.display = 'none';
      detailImage.style.display = 'none';
      imageFallback.style.display = 'flex';
      imageFallback.querySelector('p').textContent = `${temple.name} (${temple.country})`;
    };

    detailImage.alt = `Photograph of ${temple.name}`;
    detailImage.src = temple.imageUrl;
    detailImageCredit.textContent = temple.imageCredit || 'Wikimedia Commons';
    imageOverlayBadge.textContent = temple.city;
    if (linkFullImage) {
      linkFullImage.href = temple.imageUrl;
      linkFullImage.setAttribute('aria-label', `View full resolution image of ${temple.name}`);
    }

    // If image is already cached and loaded
    if (detailImage.complete && detailImage.naturalWidth > 0) {
      if (imageSkeleton) imageSkeleton.style.display = 'none';
      detailImage.style.display = 'block';
      detailImage.style.opacity = '1';
    }

    // Highlight selected marker pin
    highlightMarker(templeId);

    // Slide in Details Panel
    detailsPanel.classList.add('active');
    detailsPanel.setAttribute('aria-hidden', 'false');

    // On mobile, show the dark backdrop and lock body scroll
    if (window.innerWidth <= 768) {
      panelBackdrop.classList.add('active');
      document.body.classList.add('drawer-open');
    }

    // Close directory drawer if open
    closeDirectoryDrawer();

    // Smoothly pan map to center temple
    panToTempleSmoothly(temple);

    // Ensure details panel and scrollable container are cleanly reset to top
    detailsPanel.scrollTop = 0;
    const scrollContainer = document.getElementById('details-scroll');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }

  /**
   * Smoothly pans to a temple taking into account desktop drawer width
   * so the marker is not covered by the sliding panel.
   */
  function panToTempleSmoothly(temple) {
    if (!map) return;

    if (window.innerWidth > 768) {
      const zoom = Math.max(map.getZoom(), 5);
      map.setView([temple.latitude, temple.longitude], zoom, {
        animate: true,
        duration: 0.75
      });
    } else {
      map.panTo([temple.latitude, temple.longitude], {
        animate: true,
        duration: 0.75
      });
    }
  }

  /**
   * Closes the details panel and restores default state.
   */
  function closeDetailsPanel() {
    detailsPanel.classList.remove('active');
    detailsPanel.setAttribute('aria-hidden', 'true');
    panelBackdrop.classList.remove('active');
    document.body.classList.remove('drawer-open');

    // Clear hash cleanly without jumping
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Remove marker pin highlight
    if (currentActiveTempleId) {
      const pin = document.getElementById(`pin-${currentActiveTempleId}`);
      if (pin) pin.classList.remove('selected');
      currentActiveTempleId = null;
    }
  }

  /**
   * Navigates to previous or next temple in the list.
   * 
   * @param {number} direction - -1 for previous, +1 for next
   */
  function navigateTemple(direction) {
    if (!allTemples.length) return;

    let currentIndex = allTemples.findIndex(t => t.id === currentActiveTempleId);
    if (currentIndex === -1) currentIndex = 0;

    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = allTemples.length - 1;
    if (nextIndex >= allTemples.length) nextIndex = 0;

    openDetailsPanel(allTemples[nextIndex].id);
  }

  /**
   * Highlights the marker pin of the active temple with glowing pulse.
   */
  function highlightMarker(templeId) {
    document.querySelectorAll('.temple-pin.selected').forEach(el => el.classList.remove('selected'));
    const pin = document.getElementById(`pin-${templeId}`);
    if (pin) {
      pin.classList.add('selected');
    }
  }

  /**
   * Populates the Temple Directory drawer list with searchable cards.
   */
  function renderDirectoryList(temples) {
    templeListContainer.innerHTML = '';

    if (temples.length === 0) {
      templeListContainer.innerHTML = '<p style="padding:1.5rem;color:var(--text-muted);text-align:center;">No temples found matching your filter.</p>';
      return;
    }

    // Sort alphabetically by name
    const sorted = [...temples].sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(temple => {
      const card = document.createElement('div');
      card.className = 'temple-card-item';
      card.tabIndex = 0;
      card.role = 'button';
      card.setAttribute('aria-label', `View ${temple.name} in ${temple.country}`);

      card.innerHTML = `
        <div class="card-top">
          <span class="card-name">${escapeHtml(temple.name)}</span>
          <span class="card-region">${escapeHtml(temple.region || 'Sacred')}</span>
        </div>
        <div class="card-loc">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${escapeHtml(temple.city)}, ${escapeHtml(temple.country)}</span>
        </div>
      `;

      const selectTemple = () => {
        closeDirectoryDrawer();
        openDetailsPanel(temple.id);
      };

      card.addEventListener('click', selectTemple);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectTemple();
        }
      });

      templeListContainer.appendChild(card);
    });
  }

  /**
   * Opens the Temple Directory Drawer.
   */
  function openDirectoryDrawer() {
    listDrawer.classList.add('active');
    listDrawer.setAttribute('aria-hidden', 'false');
    btnToggleList.setAttribute('aria-expanded', 'true');
    panelBackdrop.classList.add('active');
    document.body.classList.add('drawer-open');
    closeDetailsPanel();

    if (drawerSearchInput) {
      setTimeout(() => drawerSearchInput.focus(), 200);
    }
  }

  /**
   * Closes the Temple Directory Drawer.
   */
  function closeDirectoryDrawer() {
    listDrawer.classList.remove('active');
    listDrawer.setAttribute('aria-hidden', 'true');
    btnToggleList.setAttribute('aria-expanded', 'false');
    if (!detailsPanel.classList.contains('active')) {
      panelBackdrop.classList.remove('active');
      document.body.classList.remove('drawer-open');
    }
  }

  /**
   * Applies search and region filters to the temple list.
   * Updates map markers and directory list.
   * 
   * @param {boolean} autoFit - Whether to adjust map view bounds automatically
   */
  function applyFilters(autoFit = true) {
    const searchTerm = (searchInput.value || '').trim().toLowerCase();
    const selectedRegion = regionFilter.value;

    if (btnClearSearch) {
      btnClearSearch.style.display = searchTerm ? 'flex' : 'none';
    }

    const filtered = allTemples.filter(temple => {
      const matchesRegion = (selectedRegion === 'all') || (temple.region === selectedRegion);
      const matchesSearch = !searchTerm ||
        temple.name.toLowerCase().includes(searchTerm) ||
        temple.city.toLowerCase().includes(searchTerm) ||
        temple.country.toLowerCase().includes(searchTerm) ||
        (temple.summary && temple.summary.toLowerCase().includes(searchTerm)) ||
        (temple.architecture && temple.architecture.toLowerCase().includes(searchTerm));

      return matchesRegion && matchesSearch;
    });

    currentlyFilteredTemples = filtered;
    renderMarkers(filtered);
    renderDirectoryList(filtered);

    if (autoFit && filtered.length > 0) {
      if (selectedRegion === 'all' && !searchTerm) {
        centerOnIndia(true);
      } else {
        fitMapToMarkers(filtered);
      }
    }
  }

  /**
   * Fits map viewport bounds to display current matching markers.
   */
  function fitMapToMarkers(temples) {
    if (!map || temples.length === 0) return;

    if (temples.length === allTemples.length) {
      centerOnIndia(true);
      return;
    }

    const bounds = L.latLngBounds(temples.map(t => [t.latitude, t.longitude]));
    map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 10
    });
  }

  /**
   * Resets map view, clears filters, and returns to prominent India overview.
   */
  function resetWorldView() {
    searchInput.value = '';
    if (btnClearSearch) btnClearSearch.style.display = 'none';
    regionFilter.value = 'all';

    // Reset region chips active state
    regionChips.forEach(chip => {
      if (chip.dataset.region === 'all') {
        chip.classList.add('active');
        chip.setAttribute('aria-selected', 'true');
      } else {
        chip.classList.remove('active');
        chip.setAttribute('aria-selected', 'false');
      }
    });

    applyFilters(false);
    closeDetailsPanel();
    closeDirectoryDrawer();
    centerOnIndia(true);
    showToast('Map centered on India', '🇮🇳', 2500);
  }

  /**
   * Checks for URL hash upon page load (e.g. #angkor-wat).
   */
  function checkUrlHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const match = allTemples.find(t => t.id === hash);
      if (match) {
        setTimeout(() => {
          openDetailsPanel(match.id, false);
        }, 300);
      }
    }
  }

  /**
   * Displays a modern toast notification message.
   */
  function showToast(message, icon = 'ℹ️', duration = 3500) {
    if (!errorToast || !errorToastText) return;

    if (toastIcon) toastIcon.textContent = icon;
    errorToastText.innerHTML = message;
    errorToast.style.display = 'flex';

    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toastTimeout = setTimeout(() => {
      errorToast.style.display = 'none';
    }, duration);
  }

  /**
   * Copies current temple link & coordinates to clipboard.
   */
  function shareCurrentTemple() {
    if (!currentActiveTempleId) return;

    const temple = allTemples.find(t => t.id === currentActiveTempleId);
    if (!temple) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}#${temple.id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast(`Link copied to clipboard for ${temple.name}!`, '📋', 3000);
      }).catch(() => {
        showToast(`Temple: ${temple.name} (#${temple.id})`, '📍', 3000);
      });
    } else {
      showToast(`Link: ${shareUrl}`, '🔗', 4000);
    }
  }

  /**
   * Escapes HTML strings to prevent XSS vulnerabilities.
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Sets up all DOM event listeners for buttons, inputs, chips, and keyboard.
   */
  function setupEventListeners() {
    // Search input live typing
    searchInput.addEventListener('input', () => {
      applyFilters();
    });

    // Clear search button
    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        applyFilters();
      });
    }

    // Keyboard shortcut: Press '/' to focus search input
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== drawerSearchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    });

    // Region dropdown selection (keeps chips in sync)
    regionFilter.addEventListener('change', () => {
      const selected = regionFilter.value;
      regionChips.forEach(chip => {
        if (chip.dataset.region === selected) {
          chip.classList.add('active');
          chip.setAttribute('aria-selected', 'true');
        } else {
          chip.classList.remove('active');
          chip.setAttribute('aria-selected', 'false');
        }
      });
      applyFilters();
    });

    // Region Chips Bar Clicks
    regionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        regionChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-selected', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-selected', 'true');

        const region = chip.dataset.region;
        regionFilter.value = region;
        applyFilters();
      });
    });

    // Center on India View Reset Button
    btnResetView.addEventListener('click', () => {
      resetWorldView();
    });

    // Directory list drawer toggle
    btnToggleList.addEventListener('click', () => {
      if (listDrawer.classList.contains('active')) {
        closeDirectoryDrawer();
      } else {
        openDirectoryDrawer();
      }
    });

    // Drawer search input filtering
    if (drawerSearchInput) {
      drawerSearchInput.addEventListener('input', () => {
        const query = (drawerSearchInput.value || '').trim().toLowerCase();
        const items = templeListContainer.querySelectorAll('.temple-card-item');
        items.forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(query) ? 'flex' : 'none';
        });
      });
    }

    // Close Details Panel Button
    btnCloseDetails.addEventListener('click', () => {
      closeDetailsPanel();
    });

    // Previous & Next Temple Navigation Buttons
    btnPrevTemple.addEventListener('click', () => {
      navigateTemple(-1);
    });

    btnNextTemple.addEventListener('click', () => {
      navigateTemple(1);
    });

    // Close Directory Drawer Button
    btnCloseDrawer.addEventListener('click', () => {
      closeDirectoryDrawer();
    });

    // Mobile FAB Buttons
    if (mobileBtnDirectory) {
      mobileBtnDirectory.addEventListener('click', () => {
        openDirectoryDrawer();
      });
    }

    if (mobileBtnReset) {
      mobileBtnReset.addEventListener('click', () => {
        resetWorldView();
      });
    }

    // Backdrop click closes any open sheet or drawer
    panelBackdrop.addEventListener('click', () => {
      closeDetailsPanel();
      closeDirectoryDrawer();
    });

    // Zoom to Active Temple button
    btnZoomToActive.addEventListener('click', () => {
      if (currentActiveTempleId) {
        const temple = allTemples.find(t => t.id === currentActiveTempleId);
        if (temple && map) {
          map.setView([temple.latitude, temple.longitude], 15, {
            animate: true
          });
        }
      }
    });

    // Share Temple Button
    if (btnShareTemple) {
      btnShareTemple.addEventListener('click', () => {
        shareCurrentTemple();
      });
    }

    // Dismiss Error Toast
    if (btnDismissToast) {
      btnDismissToast.addEventListener('click', () => {
        errorToast.style.display = 'none';
      });
    }

    // Global Keyboard Shortcuts (Escape, Left Arrow, Right Arrow)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (detailsPanel.classList.contains('active')) {
          closeDetailsPanel();
        } else if (listDrawer.classList.contains('active')) {
          closeDirectoryDrawer();
        }
      } else if (detailsPanel.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
          navigateTemple(-1);
        } else if (e.key === 'ArrowRight') {
          navigateTemple(1);
        }
      }
    });

    // Listen to hashchange events for browser back/forward buttons
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const match = allTemples.find(t => t.id === hash);
        if (match && currentActiveTempleId !== match.id) {
          openDetailsPanel(match.id, false);
        }
      } else if (detailsPanel.classList.contains('active')) {
        closeDetailsPanel();
      }
    });

    // Handle window resize gracefully
    window.addEventListener('resize', () => {
      if (map) {
        map.invalidateSize();
      }
    });
  }

  // --- EXPOSE GLOBAL NAMESPACE ---
  window.TempleAtlas = {
    openDetails: openDetailsPanel,
    resetView: resetWorldView,
    centerIndia: centerOnIndia,
    navigate: navigateTemple
  };

})();
