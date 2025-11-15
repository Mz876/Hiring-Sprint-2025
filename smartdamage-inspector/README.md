# 🚗 SmartDamage Inspector

**AI-Powered Vehicle Condition Assessment** | Full-Stack Prototype

SmartDamage Inspector is a full-stack web application that automates vehicle condition inspection for rental companies. The system compares pickup and return images, detects damages using AI, identifies new vs. existing damage, and produces comprehensive inspection reports.

> Built as part of the Aspire Hiring Sprint

---

## 📌 Features

### 🔍 Damage Detection
- **YOLO model** detects dents, scratches, broken parts, and severity levels
- **Bounding box overlays** drawn dynamically on images
- **Confidence scoring** for each detection

### 🔁 Pickup vs Return Comparison
- Automatically matches return photos with the closest pickup photo
- Distinguishes **new vs pre-existing damages**
- Per-image comparison summary

### 🧠 AI Narrative (LLM)
- Generates natural language descriptions of detected damage
- Summarizes severity and affected components

### 💰 Cost Estimation
Calculates:
- Worst-image severity
- Total severity score
- Estimated repair cost

### 🎨 Modern UI
- Responsive Next.js application
- Animated interactions with Framer Motion
- Clean visual overlays for detections

### 📚 API Documentation
- Fully documented using OpenAPI/Swagger
- Auto-served via Express backend

---

## 🔗 Live URLs

| Service | URL |
|---------|-----|
| Frontend (Next.js) | TBD |
| Backend (Express API) | TBD |
| Swagger API Docs | TBD |

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React** + **TypeScript**
- **TailwindCSS** for styling
- **Framer Motion** for animations
- Client-side rendering of damage overlays

### Backend
- **Node.js** + **Express**
- **Multer** for file uploads
- **YOLO** detection API
- **Qwen LLM** API for damage descriptions
- Custom comparison + scoring engine
- **OpenAPI** (Swagger UI) documentation

---

## 📁 Project Structure

```
smartdamage-inspector/
└── apps/
    ├── backend/
    │   ├── src/
    │   │   ├── routes/
    │   │   ├── controllers/
    │   │   ├── utils/
    │   │   └── app.js
    │   ├── docs/
    │   │   └── openapi.yaml
    │   └── package.json
    │
    └── frontend/
        ├── app/
        ├── components/
        ├── lib/
        └── package.json
```

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/smartdamage-inspector
cd smartdamage-inspector/apps
```

### 🚀 Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

#### Required Environment Variables

```env
PORT=4000
YOLO_API_KEY=your_key_here
LLM_API_KEY=your_key_here
```

#### Run Backend

```bash
npm run dev
```

- **Backend:** http://localhost:4000
- **Swagger Docs:** http://localhost:4000/api-docs

### 💻 Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

- **Frontend:** http://localhost:3000

---

## 🧩 Usage Workflow

1. **Upload Pickup Images** - Upload before photos (max 6)
2. **Upload Return Images** - Upload after photos (max 6)
3. **Run AI Analysis** - Click "Analyze Damage"
4. **View Results** - Review comprehensive analysis including:
   - Bounding boxes of detected damage
   - Confidence scores
   - New vs pre-existing damage markers
   - AI-generated narrative
   - Estimated repair costs
   - Per-image severity scoring
   - Matched pickup/return image pairs

---

## 📚 API Documentation

Accessible at: `/api-docs`

### Main Endpoint: `POST /api/analyze`

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `pickup[]` | File[] | Before images (vehicle pickup) |
| `returned[]` | File[] | After images (vehicle return) |

### Response Example

```json
{
  "summary": {
    "severityScore": 0.72,
    "estimatedRepairCost": 480,
    "worstImageFilename": "return_3.jpg"
  },
  "returnedAnalyses": [
    {
      "filename": "return_3.jpg",
      "yolo": {
        "predictions": [
          {
            "class": "rear-bumper-dent",
            "confidence": 0.43,
            "x": 480,
            "y": 490,
            "width": 300,
            "height": 200
          }
        ]
      },
      "qwen": {
        "description": "A moderate dent is visible on the rear bumper..."
      }
    }
  ]
}
```

---

## ⚠️ Known Limitations (Prototype)

- YOLO detections depend on off-the-shelf model accuracy
- Not optimized for extreme angles or night photos
- No image storage (in-memory only)
- Image pairing uses perceptual hashing (not perfect)
- Repair cost model is heuristic

---

## 🌱 Future Improvements

- [ ] Fine-tuned YOLO on vehicle damage dataset
- [ ] Persistent storage (S3 or Supabase)
- [ ] User accounts + authentication
- [ ] Higher accuracy pickup-return matching
- [ ] More detailed severity & cost model
- [ ] Offline mobile version with Expo

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](your-issues-url).

---

**Made with ❤️ for the Aspire Hiring Sprint**