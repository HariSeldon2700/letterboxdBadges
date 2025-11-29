# 📚 Letterboxd Badges  
**Book • Country • Related-Film badges directly on Letterboxd**

Instant context for every film.  
Know whether a movie is based on a book, where it comes from, or how it fits into a lineage — all without leaving Letterboxd.

---

## ⭐ Install

👉 **Chrome Web Store:**  
*(WIP — link will appear when published)*

---

## ✨ What it does

Letterboxd shows posters.  
**Letterboxd Badges shows the story behind those posters.**

This extension adds three types of metadata badges across the entire site:

### 📖 Based on a Book  
Shows if a film is adapted from a novel or literary work.

### 🌍 Country of Origin  
Displays a flag + country name, linking to Letterboxd’s country page.

### 🔁 Related Films  
Shows **“Earlier related”** / **“Later related”** badges when a film has  
remakes, originals, related adaptations, or lineage connections.

### 🧩 Where badges appear

- On posters (lists, watchlists, search, profiles, activity, etc.)  
- As chips under the film title on film pages  
- Optional compact mode for tiny posters  

---

## 🧩 Why this is useful

Letterboxd doesn’t tell you:

- That *The Thing* is based on a novella  
- That *Stalker* is adapted from a novel  
- That *Rififi*, *Solaris*, or *Nosferatu* have earlier versions  
- That *Intolerance* has later related films  
- What country a film comes from at a glance  

**This extension gives you immediate insight — without opening new tabs or searching.**

---

## 🖼 Screenshots

*(Add your images here)*

- Poster overlays  
- Film page chips  
- Toggle UI (optional)  

---

## ⚙️ Features

✔ Adds smart badges to all film posters  
✔ Contextual chips under film titles  
✔ Uses Wikidata + Letterboxd scraping for accuracy  
✔ *Earlier/Later Related* → clearer than “remake/original”  
✔ Per-category toggles (Book, Country, Related films)  
✔ Optional corner toggle UI (can be hidden)  
✔ Lightweight, no tracking, no analytics  
✔ Local caching for fast browsing  
✔ Fully open-source (MIT)

---

## 🔧 Settings

You can enable/disable each badge type independently:

- 📖 Books  
- 🔁 Related films  
- 🌍 Country  

You can also hide the in-page toggle UI while keeping badges active.  
All settings persist automatically.

---

## 🛠 How it works (for the curious)

1. Detects all film poster links on the page  
2. Extracts the film slug (e.g., `/film/glass-onion/`)  
3. Fetches metadata from:
   - **Wikidata SPARQL**
   - **Letterboxd pages** (fallback scraping)
4. Determines:
   - Book status  
   - Country of origin  
   - Older/later related film candidates  
5. Chooses the best related film based on rating counts  
6. Caches results locally for speed (up to 14 days)  
7. Injects badges/tags into the DOM  
8. Updates dynamically with PJAX navigation

---

## 🧑‍💻 For developers & contributors

This extension is fully open-source.  
Pull requests, issues, and improvements welcome.

**Repo:**  
https://github.com/HariSeldon2700/letterboxdBadges

---

## 🧑‍🎨 Credits

Built by **Barantino** + a lot of AI help (pls be gentle, I'm a mere VFX Artist by profession 🙂).  
Data from **Wikidata** + **Letterboxd**.  
Inspired by a desire to see more film context at a glance.

*Letterboxd™ is a trademark of Letterboxd Limited — this is an independent, fan-made project.*

---

## 📄 License

Released under the **MIT License**.  
Feel free to fork, improve, remix, or build on it.

---

## ☕ Support

If you enjoy the extension, you can support it here:  
👉 https://buymeacoffee.com/barantino6t
