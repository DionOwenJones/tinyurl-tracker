# TinyTrack 🌍

A modern URL shortener with real-time global click tracking and visualization. Create short links and watch your content spread across the globe in real-time with an interactive heatmap.

**[Try the Live Demo](https://tinyurl-tracker.vercel.app/)**

![TinyTrack Screenshot](screenshot.png)

> 💡 *Screenshot shows the interactive world map and click tracking features*

## Features ✨

- **URL Shortening**: Convert long URLs into concise, shareable links
- **Real-time Analytics**: Track clicks as they happen
- **Global Visualization**: Interactive world map showing your link's reach
- **Click Heatmaps**: See where your content is most popular
- **Modern UI**: Clean, responsive design with smooth animations

## Try It Out 🚀

1. Visit the [Live Demo](https://tinyurl-tracker.vercel.app/)
2. Paste any long URL
3. Share your shortened link
4. Watch as clicks appear on the world map!

## Implementation Guide 🛠️

Want to build your own URL shortener? Here's what you'll need:

### Frontend
- HTML, CSS, and JavaScript
- Google Maps JavaScript API for visualization
- Modern UI framework of your choice

### Backend
- Database for storing URLs and click data
- API endpoints for:
  - URL shortening
  - Click tracking
  - Analytics retrieval
- Geolocation service for IP addresses

### Example Database Schema

```sql
-- URLs table
CREATE TABLE urls (
    id UUID PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE
);

-- Clicks table
CREATE TABLE clicks (
    id UUID PRIMARY KEY,
    short_code TEXT NOT NULL,
    ip_address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    city TEXT,
    country TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE
);
```

This repository contains a working implementation using:
- Supabase for the backend
- Google Maps for visualization
- Vanilla JavaScript for simplicity

## FAQ ❓

**Q: Can I use this code in my project?**
A: Yes! Feel free to use this code as inspiration for your own implementation.

**Q: How can I deploy my own version?**
A: You can deploy to platforms like Vercel, Netlify, or GitHub Pages. Just remember to set up your own backend service.

**Q: What backend should I use?**
A: Any backend that can store data and handle API requests will work. This demo uses Supabase, but you could use Firebase, MongoDB, or your own server.

**Q: How does the geolocation work?**
A: The demo uses IP geolocation. You can implement this using services like MaxMind, ipapi.co, or similar services.

## Inspiration 💡

This project demonstrates how to:
- Create a modern, responsive UI
- Implement real-time analytics
- Visualize geographic data
- Handle URL shortening
- Track user interactions

Use it as a starting point to build your own unique URL shortener!

## License 📄

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 Dion Owen Jones

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Contact 📧

Dion Owen Jones - [@dionowenjones](https://github.com/dionowenjones)

Project Link: [https://github.com/DionOwenJones/tinyurl-tracker](https://github.com/DionOwenJones/tinyurl-tracker)
