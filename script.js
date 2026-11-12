/**
 * ============================================================================
 * TEMPLE ATLAS - JAVASCRIPT APPLICATION LOGIC
 * ============================================================================
 * A complete, pure vanilla JavaScript application for an interactive world map
 * of prominent Hindu temples. Built for clarity and educational presentation.
 * 
 * Features:
 * - Decoupled data model loaded from temples.json
 * - Leaflet.js interactive world map with OpenStreetMap tiles
 * - Custom SVG temple marker pins in saffron, maroon, and gold
 * - Smart desktop hover preview with graceful delay for easy button clicking
 * - Full touch support on mobile (tap to open pop-up)
 * - Responsive sliding details panel (right on desktop, bottom on mobile)
 * - Search bar, region filters, world view reset, and full directory drawer
 * - Friendly error handling for file:// protocol and network issues
 * ============================================================================
 */

(function () {
  'use strict';

  // --- APPLICATION STATE ---
  let map = null;                    // Leaflet map instance
  let allTemples = [];               // Complete array of temples loaded from JSON
  let markerMap = new Map();         // temple.id -> L.Marker
  let currentActiveTempleId = null;  // ID of currently inspected temple
  let hoverCloseTimer = null;        // Timer handle for desktop hover pop-up delay
  let isHoveringPopup = false;       // Flag tracking whether cursor is inside pop-up
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;

  // --- DOM ELEMENT REFERENCES ---
  const mapElement = document.getElementById('map');
  const mapLoader = document.getElementById('map-loader');
  const searchInput = document.getElementById('search-input');
  const regionFilter = document.getElementById('region-filter');
  const btnResetView = document.getElementById('btn-reset-view');
  const btnToggleList = document.getElementById('btn-toggle-list');
  const templeCounterText = document.getElementById('temple-counter-text');

  // Details Panel DOM Elements
  const detailsPanel = document.getElementById('details-panel');
  const panelBackdrop = document.getElementById('panel-backdrop');
  const btnCloseDetails = document.getElementById('btn-close-details');
  const detailRegionTag = document.getElementById('detail-region-tag');
  const detailTempleName = document.getElementById('detail-temple-name');
  const detailCityCountry = document.getElementById('detail-city-country');
  const detailImage = document.getElementById('detail-image');
  const imageFallback = document.getElementById('image-fallback');
  const detailImageCredit = document.getElementById('detail-image-credit');
  const detailSummary = document.getElementById('detail-summary');
  const detailHistory = document.getElementById('detail-history');
  const detailArchitecture = document.getElementById('detail-architecture');
  const detailLocation = document.getElementById('detail-location');
  const detailSignificance = document.getElementById('detail-significance');
  const detailFestivals = document.getElementById('detail-festivals');
  const btnZoomToActive = document.getElementById('btn-zoom-to-active');

  // Directory Drawer DOM Elements
  const listDrawer = document.getElementById('list-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const templeListContainer = document.getElementById('temple-list-container');

  // Error Toast DOM Elements
  const errorToast = document.getElementById('error-toast');
  const errorToastText = document.getElementById('error-toast-text');
  const btnDismissToast = document.getElementById('btn-dismiss-toast');

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadTempleData();
    setupEventListeners();
  });

  /**
   * Initializes the Leaflet world map with OpenStreetMap tiles.
   * Configures global bounds, minimum zoom, and worldCopyJump.
   */
  function initMap() {
    // Center map showing the entire world
    map = L.map('map', {
      center: [20, 20],
      zoom: 2.3,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
      zoomControl: true
    });

    // Add OpenStreetMap tile layer with full attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Hide loader once map tiles finish initial rendering
    map.whenReady(() => {
      if (mapLoader) {
        mapLoader.style.display = 'none';
      }
    });

    // Close open popups when clicking blank map space
    map.on('click', () => {
      clearHoverTimer();
    });
  }

  /**
   * Creates a custom SVG Leaflet DivIcon for a temple marker.
   * Saffron and deep maroon palette with a sacred shikhara dome icon.
   * 
   * @param {string} templeId - Unique temple identifier
   * @returns {L.DivIcon} Leaflet DivIcon instance
   */
  function createTempleIcon(templeId) {
    const iconHtml = `
      <div class="temple-pin" id="pin-${templeId}" role="button" aria-label="Temple marker">
        <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Pin Body -->
          <path d="M18 1C8.611 1 1 8.611 1 18C1 28.5 18 43 18 43C18 43 35 28.5 35 18C35 8.611 27.389 1 18 1Z" 
                fill="#54111B" stroke="#C59B27" stroke-width="2"/>
          <!-- Inner Saffron Halo -->
          <circle cx="18" cy="18" r="13" fill="#D95A15" stroke="#E5B842" stroke-width="1.2"/>
          <!-- Sacred Temple Shikhara / Kalasha Silhouette -->
          <path d="M18 7L22 13H14L18 7Z" fill="#FFF9F0"/>
          <path d="M13 13H23L24.5 19H11.5L13 13Z" fill="#FFF9F0"/>
          <path d="M11 19H25V24C25 24.8 24.3 25.5 23.5 25.5H12.5C11.7 25.5 11 24.8 11 24V19Z" fill="#FFF9F0"/>
          <circle cx="18" cy="22" r="1.5" fill="#54111B"/>
        </svg>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'temple-marker-icon',
      iconSize: [36, 44],
      iconAnchor: [18, 44],     // Tip of the pin sits exactly on the latitude/longitude
      popupAnchor: [0, -42]     // Popup floats comfortably right above the pin
    });
  }

  /**
   * Fetches temple data asynchronously from temples.json.
   * Handles errors gracefully (e.g. CORS errors when opened via file://).
   */
  async function loadTempleData() {
    try {
      const response = await fetch('temples.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      allTemples = data;

      // Populate markers on the map and populate directory drawer
      renderMarkers(allTemples);
      renderDirectoryList(allTemples);
      updateStatusCounter(allTemples.length, allTemples.length);

      // Fit map bounds to show all markers neatly
      fitMapToMarkers(allTemples);
    } catch (err) {
      console.error('Failed to load temple data:', err);
      showErrorMessage(
        'Could not load temple data from temples.json. ' +
        'If opening locally, please run a simple local web server (such as "python3 -m http.server") ' +
        'because modern web browsers block JSON fetch requests across local file:// paths for security.'
      );
      if (mapLoader) {
        mapLoader.innerHTML = '<p style="color:#bf2600;">⚠️ Could not load temples.json<br><small>Requires local or hosted web server</small></p>';
      }
    }
  }

  /**
   * Renders markers for the given list of temples on the Leaflet map.
   * Configures smart hover behavior for desktop and tap behavior for mobile.
   * 
   * @param {Array} temples - Array of temple objects
   */
  function renderMarkers(temples) {
    // Clear any existing markers
    markerMap.forEach(marker => marker.remove());
    markerMap.clear();

    temples.forEach(temple => {
      const customIcon = createTempleIcon(temple.id);
      const marker = L.marker([temple.latitude, temple.longitude], {
        icon: customIcon,
        title: temple.name,
        alt: temple.name
      });

      // Construct Pop-up Content
      const popupContent = `
        <article class="popup-card">
          <span class="popup-tag">${escapeHtml(temple.region || 'Sacred Site')}</span>
          <h3 class="popup-title">${escapeHtml(temple.name)}</h3>
          <div class="popup-location">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${escapeHtml(temple.city)}, ${escapeHtml(temple.country)}</span>
          </div>
          <p class="popup-summary">${escapeHtml(temple.summary)}</p>
          <button type="button" class="btn btn-primary popup-btn" onclick="window.TempleAtlas.openDetails('${escapeHtml(temple.id)}')">
            More Details &rarr;
          </button>
        </article>
      `;

      // Bind the popup to the marker
      const popup = L.popup({
        offset: [0, -38],
        closeButton: true,
        autoPan: true,
        autoPanPadding: [30, 30]
      }).setContent(popupContent);

      marker.bindPopup(popup);

      // --- MOUSE & TOUCH EVENT BINDINGS ---
      if (!isTouchDevice) {
        // DESKTOP: Smooth Hover Behavior
        // When hovering over the marker, open popup immediately and cancel any close timer
        marker.on('mouseover', () => {
          clearHoverTimer();
          marker.openPopup();

          // Wait a tick for the popup DOM element to exist, then attach hover listeners
          setTimeout(() => {
            const popupElement = popup.getElement();
            if (popupElement && !popupElement.dataset.hoverAttached) {
              popupElement.dataset.hoverAttached = 'true';

              // Cursor entered the popup: cancel closing so user can click "More Details"
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

        // When mouse leaves marker, start close countdown (350ms window allows moving mouse onto popup)
        marker.on('mouseout', () => {
          if (!isHoveringPopup) {
            startHoverCloseTimer(popup);
          }
        });
      }

      // CLICK / TAP (Desktop and Mobile):
      // Clicking marker opens popup permanently (cancelling hover close timers)
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
   * Gives users plenty of time (380ms) to move mouse from pin onto the pop-up button.
   */
  function startHoverCloseTimer(popup) {
    clearHoverTimer();
    hoverCloseTimer = setTimeout(() => {
      if (!isHoveringPopup && map) {
        map.closePopup(popup);
      }
    }, 380);
  }

  /**
   * Clears any active pop-up hover close countdown.
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
   */
  function openDetailsPanel(templeId) {
    const temple = allTemples.find(t => t.id === templeId);
    if (!temple) return;

    currentActiveTempleId = templeId;
    clearHoverTimer();

    // Close any floating popup on map so view is clean
    if (map) {
      map.closePopup();
    }

    // Populate details panel content
    detailRegionTag.textContent = temple.region || 'Sacred Temple';
    detailTempleName.textContent = temple.name;
    detailCityCountry.textContent = `${temple.city}, ${temple.country}`;
    detailSummary.textContent = temple.summary;
    detailHistory.textContent = temple.history;
    detailArchitecture.textContent = temple.architecture;
    detailLocation.textContent = temple.location;
    detailSignificance.textContent = temple.significance;

    // Populate Festivals as badges
    detailFestivals.innerHTML = '';
    if (Array.isArray(temple.festivals) && temple.festivals.length > 0) {
      temple.festivals.forEach(fest => {
        const li = document.createElement('li');
        li.textContent = fest;
        detailFestivals.appendChild(li);
      });
    }

    // Handle Image Loading and Fallback
    imageFallback.style.display = 'none';
    detailImage.style.display = 'block';
    detailImage.src = temple.imageUrl;
    detailImage.alt = `Photograph of ${temple.name}`;
    detailImageCredit.textContent = temple.imageCredit || 'Wikimedia Commons';

    // Graceful error handler if image fails to load
    detailImage.onerror = () => {
      detailImage.style.display = 'none';
      imageFallback.style.display = 'flex';
      imageFallback.querySelector('p').textContent = `${temple.name} (${temple.country})`;
    };

    // Highlight selected marker pin
    highlightMarker(templeId);

    // Slide in Details Panel
    detailsPanel.classList.add('active');
    detailsPanel.setAttribute('aria-hidden', 'false');

    // On mobile, show the dark backdrop
    if (window.innerWidth <= 768) {
      panelBackdrop.classList.add('active');
    }

    // Close directory drawer if it was open
    closeDirectoryDrawer();

    // Smoothly pan map to center the active temple
    if (map) {
      map.panTo([temple.latitude, temple.longitude], {
        animate: true,
        duration: 0.75
      });
    }

    // Scroll details panel back to top
    const scrollContainer = document.getElementById('details-scroll');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }

  /**
   * Closes the details panel and restores default state.
   */
  function closeDetailsPanel() {
    detailsPanel.classList.remove('active');
    detailsPanel.setAttribute('aria-hidden', 'true');
    panelBackdrop.classList.remove('active');

    // Remove marker pin highlight
    if (currentActiveTempleId) {
      const pin = document.getElementById(`pin-${currentActiveTempleId}`);
      if (pin) pin.classList.remove('selected');
      currentActiveTempleId = null;
    }
  }

  /**
   * Highlights the marker pin of the active temple.
   */
  function highlightMarker(templeId) {
    // Un-highlight previous
    document.querySelectorAll('.temple-pin.selected').forEach(el => el.classList.remove('selected'));

    const pin = document.getElementById(`pin-${templeId}`);
    if (pin) {
      pin.classList.add('selected');
    }
  }

  /**
   * Populates the Temple Directory drawer list.
   */
  function renderDirectoryList(temples) {
    templeListContainer.innerHTML = '';

    if (temples.length === 0) {
      templeListContainer.innerHTML = '<p style="padding:1rem;color:var(--text-muted);text-align:center;">No temples found matching your filter.</p>';
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
        <div class="card-loc">📍 ${escapeHtml(temple.city)}, ${escapeHtml(temple.country)}</div>
      `;

      // Click or Enter key selects temple
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
    closeDetailsPanel();
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
    }
  }

  /**
   * Applies search and region filters to the temple list.
   */
  function applyFilters() {
    const searchTerm = (searchInput.value || '').trim().toLowerCase();
    const selectedRegion = regionFilter.value;

    const filtered = allTemples.filter(temple => {
      // Region Match
      const matchesRegion = (selectedRegion === 'all') || (temple.region === selectedRegion);

      // Search Query Match (matches name, city, country, or summary)
      const matchesSearch = !searchTerm ||
        temple.name.toLowerCase().includes(searchTerm) ||
        temple.city.toLowerCase().includes(searchTerm) ||
        temple.country.toLowerCase().includes(searchTerm) ||
        (temple.summary && temple.summary.toLowerCase().includes(searchTerm));

      return matchesRegion && matchesSearch;
    });

    renderMarkers(filtered);
    renderDirectoryList(filtered);
    updateStatusCounter(filtered.length, allTemples.length);

    if (filtered.length > 0) {
      fitMapToMarkers(filtered);
    }
  }

  /**
   * Fits map viewport bounds to display all current markers nicely.
   */
  function fitMapToMarkers(temples) {
    if (!map || temples.length === 0) return;

    if (temples.length === allTemples.length) {
      // If showing all, set a balanced world view
      map.setView([20, 20], 2.3);
      return;
    }

    const bounds = L.latLngBounds(temples.map(t => [t.latitude, t.longitude]));
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 12
    });
  }

  /**
   * Resets map view and clears any active filters.
   */
  function resetWorldView() {
    searchInput.value = '';
    regionFilter.value = 'all';
    applyFilters();
    closeDetailsPanel();
    closeDirectoryDrawer();
    map.setView([20, 20], 2.3);
  }

  /**
   * Updates the floating status counter (e.g., "Showing 20 of 20 temples").
   */
  function updateStatusCounter(visibleCount, totalCount) {
    if (templeCounterText) {
      if (visibleCount === totalCount) {
        templeCounterText.textContent = `Showing all ${totalCount} sacred sites`;
      } else {
        templeCounterText.textContent = `Showing ${visibleCount} of ${totalCount} sacred sites`;
      }
    }
  }

  /**
   * Displays an error message banner/toast.
   */
  function showErrorMessage(message) {
    if (errorToast && errorToastText) {
      errorToastText.innerHTML = message;
      errorToast.style.display = 'flex';
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
   * Sets up all DOM event listeners for buttons, inputs, and keyboard shortcuts.
   */
  function setupEventListeners() {
    // Search input typing
    searchInput.addEventListener('input', () => {
      applyFilters();
    });

    // Region dropdown selection
    regionFilter.addEventListener('change', () => {
      applyFilters();
    });

    // Reset view button
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

    // Close Details Panel button
    btnCloseDetails.addEventListener('click', () => {
      closeDetailsPanel();
    });

    // Close Directory Drawer button
    btnCloseDrawer.addEventListener('click', () => {
      closeDirectoryDrawer();
    });

    // Backdrop click closes any open sheet or drawer
    panelBackdrop.addEventListener('click', () => {
      closeDetailsPanel();
      closeDirectoryDrawer();
    });

    // Zoom in on Active Temple button in details footer
    btnZoomToActive.addEventListener('click', () => {
      if (currentActiveTempleId) {
        const temple = allTemples.find(t => t.id === currentActiveTempleId);
        if (temple && map) {
          map.setView([temple.latitude, temple.longitude], 14, {
            animate: true
          });
        }
      }
    });

    // Dismiss Error Toast
    if (btnDismissToast) {
      btnDismissToast.addEventListener('click', () => {
        errorToast.style.display = 'none';
      });
    }

    // Global Keyboard Shortcuts (Escape key closes open panels)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (detailsPanel.classList.contains('active')) {
          closeDetailsPanel();
        } else if (listDrawer.classList.contains('active')) {
          closeDirectoryDrawer();
        }
      }
    });

    // Handle window resize for map responsiveness
    window.addEventListener('resize', () => {
      if (map) {
        map.invalidateSize();
      }
    });
  }

  // --- EXPOSE GLOBAL NAMESPACE ---
  // Expose openDetails method so Leaflet pop-up buttons can trigger panel cleanly
  window.TempleAtlas = {
    openDetails: openDetailsPanel,
    resetView: resetWorldView
  };

})();

