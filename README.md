# 🏛️ Temple Atlas — Sacred Hindu Temples Across the Globe

A complete, interactive, and responsive educational web application showcasing 20 prominent Hindu temples from diverse continents around the world. Built as a static website with **no frameworks**, **no build tools**, **no database**, and **no API keys**, designed to be hosted for free on **GitHub Pages** or **Netlify**.

---

## 🗺️ Project Overview

**Temple Atlas** allows students, teachers, and visitors to explore sacred Hindu architecture across Asia, Europe, North America, Oceania, and Africa. From ancient UNESCO World Heritage sites like Angkor Wat in Cambodia and Prambanan in Indonesia to medieval marvels like Brihadisvara in India and modern diaspora masterpieces like BAPS Akshardham in New Jersey, this project maps their geographic coordinates, architectural styles, history, and cultural significance.

### Key Highlights
- **100% Static & Lightweight:** Pure HTML5, CSS3, and modern Vanilla JavaScript (ES6+).
- **Interactive Global Map:** Powered by [Leaflet.js](https://leafletjs.com/) with [OpenStreetMap](https://www.openstreetmap.org/) tiles and full attribution.
- **Decoupled Temple Data:** All 20 temples are stored in a standalone [`temples.json`](temples.json) file. New temples can be added at any time without modifying any HTML or JavaScript.
- **Desktop Hover & Mobile Touch:** Hovering over a marker opens a concise pop-up with a smart delay timer so users can comfortably move the cursor onto the "More Details" button. On mobile touchscreens, a simple tap opens the pop-up.
- **Responsive Details Panel:**
  - **Desktop:** The details panel slides smoothly from the right side of the screen, keeping the map visible beside it.
  - **Mobile:** The details panel slides up from the bottom as an accessible full-width sheet with scrollable content.
- **Rich Educational Content:** Every temple features historical narratives, architectural analysis, geographical access notes, religious significance, major festival lists, and freely licensed Wikimedia Commons photographs with author credits.
- **Search & Filter:** Search in real-time by temple name, city, or country, or filter by global region.
- **Dignified Aesthetic:** Warm, respectful color palette (saffron, deep maroon, cream parchment, and temple gold) with elegant typography.

---

## 📂 Files Included

```text
temple-atlas/
├── index.html        # Main HTML structure, metadata, header, map container, and panels
├── style.css         # Responsive styling, color theme, sliding drawers, and animations
├── script.js         # Map initialization, data fetching, hover delay logic, and event handlers
├── temples.json      # Complete database of 20 temples with accurate coordinates & details
└── README.md         # Documentation, teacher explanation guide, and hosting instructions
```

---

## 💻 Running the Project Locally

Because the project fetches data dynamically from `temples.json`, modern web browsers restrict `fetch()` requests when opening files directly using the `file://` protocol due to **CORS (Cross-Origin Resource Sharing) security policies**.

To run the site locally on your computer, choose any of the simple methods below:

### Option 1: Python 3 (Recommended & Built-in on macOS/Linux)
1. Open your Terminal and navigate to the project directory:
   ```bash
   cd /path/to/temple-atlas
   ```
2. Start Python's built-in local web server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and visit:
   ```text
   http://localhost:8000
   ```

### Option 2: VS Code "Live Server" Extension
1. Open the `temple-atlas` folder in **Visual Studio Code**.
2. Install the extension called **"Live Server"** by *Ritwick Dey* (if not already installed).
3. Right-click on `index.html` in the file explorer and click **"Open with Live Server"**.
4. Your browser will automatically launch the site with live reloading.

### Option 3: Node.js / npx
If you have Node.js installed, run:
```bash
npx serve .
# or
npx http-server -p 8000
```

---

## 🌐 Free Hosting Guide

Because Temple Atlas is a purely static website with zero dependencies, it can be hosted permanently online for free in under two minutes.

---

### Method A: Hosting on GitHub Pages (Step-by-Step)

[GitHub Pages](https://pages.github.com/) is a free hosting service provided by GitHub that turns any repository into a live website.

#### Step 1: Create a GitHub Repository
1. Sign in to your account at [github.com](https://github.com).
2. Click the **"+"** icon in the top-right corner and select **New repository**.
3. Name your repository (for example: `temple-atlas`).
4. Keep the repository **Public** (required for free GitHub Pages).
5. Leave "Initialize with a README" unchecked, then click **Create repository**.

#### Step 2: Push or Upload Files
* **Via Git Command Line:**
  ```bash
  cd temple-atlas
  git init
  git add .
  git commit -m "Initial release of Temple Atlas website"
  git branch -M main
  git remote add origin https://github.com/<your-username>/temple-atlas.git
  git push -u origin main
  ```
* **Or via Web Browser (No Terminal Required):**
  1. On your new repository page, click **"uploading an existing file"**.
  2. Drag and drop all five files (`index.html`, `style.css`, `script.js`, `temples.json`, `README.md`).
  3. Enter a commit message (e.g., "Upload Temple Atlas files") and click **Commit changes**.

#### Step 3: Enable GitHub Pages
1. In your GitHub repository, click the **Settings** tab near the top.
2. In the left navigation menu, click **Pages** (under the "Code and automation" section).
3. Under **Build and deployment**:
   - **Source:** Select **Deploy from a branch**.
   - **Branch:** Select `main` (or `master`) and set the folder to `/ (root)`.
4. Click **Save**.

#### Step 4: View Your Live Website
- Wait approximately 60 to 90 seconds.
- Refresh the Pages settings tab; a banner will appear displaying your live website link:
  ```text
  Your site is live at https://<your-username>.github.io/temple-atlas/
  ```

---

### Method B: Hosting on Netlify Drop (Drag-and-Drop, No Account Required)

[Netlify Drop](https://app.netlify.com/drop) allows you to launch a live website in seconds by simply dragging your folder into the browser.

#### Step 1: Prepare Your Folder
Make sure all project files are together in a single folder named `temple-atlas`:
- `index.html`
- `style.css`
- `script.js`
- `temples.json`
- `README.md`

#### Step 2: Drag and Drop
1. Open your web browser and navigate to:
   ```text
   https://app.netlify.com/drop
   ```
2. Drag the entire `temple-atlas` folder from your file manager (Finder on Mac or File Explorer on Windows) and drop it inside the dotted box on Netlify.

#### Step 3: Instant Live Site
1. Netlify will upload and process the files in about 5 seconds.
2. It will immediately generate a live, secure HTTPS URL (for example: `https://compassionate-shirley-123456.netlify.app`).
3. You can click on the link to view your live site.
4. *(Optional)* If you create a free Netlify account, you can change the site name to something custom, such as `https://temple-atlas.netlify.app`, under **Site configuration > Change site name**.

---

## 🏛️ Temple Data & How to Add New Temples

All temple entries are stored in [`temples.json`](temples.json). Each temple is an object with the following schema:

```json
{
  "id": "unique-kebab-case-id",
  "name": "Full Name of Temple",
  "city": "City or District",
  "country": "Country",
  "region": "South Asia | Southeast Asia | North America | Europe | Oceania | Africa",
  "latitude": 13.4125,
  "longitude": 103.8670,
  "summary": "1-2 sentence overview shown in the map marker pop-up.",
  "history": "Accurate historical narrative detailing founding, royal patrons, and milestones.",
  "architecture": "Style, materials, layout, towers, gopurams, and sculptural highlights.",
  "location": "Surrounding landscape, geography, and how to reach the site.",
  "significance": "Spiritual, religious, and cultural importance to devotees and heritage.",
  "festivals": [
    "Festival Name 1",
    "Festival Name 2"
  ],
  "imageUrl": "Direct URL to freely licensed Wikimedia Commons photograph",
  "imageCredit": "Attribution to photographer and license (e.g. CC BY-SA 4.0)"
}
```

### Adding a New Temple
To add a 21st temple, simply open `temples.json`, add a comma after the last entry, and paste your new temple object before the closing square bracket `]`. **You do not need to edit any HTML or JavaScript!** The map, search bar, region filter, and directory will automatically detect and display the new temple.

---

## 🎓 For Students: How to Explain This Project to Your Teacher

When presenting this project in class or to your teacher, you can explain the core engineering concepts used to build it:

1. **Separation of Concerns (Decoupled Architecture):**
   - **HTML (`index.html`)** provides the semantic backbone and accessible document structure.
   - **CSS (`style.css`)** controls visual hierarchy, typography, responsive breakpoints, and smooth transitions.
   - **JavaScript (`script.js`)** handles state, coordinates, asynchronous data loading, and interactive events.
   - **Data (`temples.json`)** is completely separated from code. Explain that real-world software engineering avoids "hardcoding" data into user interfaces.

2. **Asynchronous JavaScript (`async/await` and `fetch`):**
   - When the page loads, `fetch('temples.json')` requests the data file asynchronously without freezing the browser.
   - If an error occurs (such as an offline connection or restricted protocol), a friendly banner is shown to guide the user rather than failing silently.

3. **Geographic Mapping with Leaflet.js & OpenStreetMap:**
   - Every temple is pinned to an exact geographic coordinate using its **latitude** (North/South) and **longitude** (East/West).
   - Custom SVG marker pins were created with HTML/CSS (`L.divIcon`) using traditional colors (saffron and maroon) rather than default generic markers.

4. **Solving the Desktop Hover vs. Click Problem:**
   - On desktop, hovering over a marker opens a pop-up. However, if the pop-up closed the instant the mouse moved off the pin, the user could never reach the "More Details" button!
   - To fix this, `script.js` uses a **graceful delay timer** (`380ms` timeout). When the user moves their mouse into the pop-up, a `mouseenter` event clears the timer, keeping the pop-up open. When the mouse leaves the pop-up, it starts the countdown again.
   - On mobile touchscreens (where "hover" does not exist), the script detects touch devices and relies on touch/tap events.

5. **Responsive Mobile-First Sliding Panels:**
   - On desktop screens (`> 768px`), the details panel slides in from the right (`transform: translateX(100%)` to `0`), allowing the map to remain visible and interactive beside it.
   - On mobile screens (`<= 768px`), the panel transforms into a bottom sheet (`transform: translateY(100%)` to `0`) with a visible drag indicator and touch scroll support.

6. **Defensive Image Handling:**
   - If an external Wikimedia image fails to load due to a firewall or offline status, an `onerror` handler automatically switches to a graceful fallback graphic showing the temple's name and location, preventing broken image icons.

---

## 📜 Credits and Attributions

- **Map Engine:** [Leaflet.js](https://leafletjs.com/) (BSD 2-Clause License).
- **Map Data & Cartography:** &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (Open Database License - ODbL).
- **Typography:** Google Fonts — *Cinzel* (OFL) and *Plus Jakarta Sans* (OFL).
- **Photographs:** All temple images are sourced from [Wikimedia Commons](https://commons.wikimedia.org/) under free culture licenses (Creative Commons CC BY, CC BY-SA, CC0, or Public Domain). Specific photographer attributions are displayed under every photograph.

---

*Temple Atlas &bull; Created for Educational Presentation & School Heritage Projects*

