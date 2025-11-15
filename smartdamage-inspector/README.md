# 🚗 SmartDamage Inspector

**AI-Powered Vehicle Condition Assessment** | Full-Stack Prototype

SmartDamage Inspector is a full-stack web application that automates vehicle condition inspection for rental companies. The system compares pickup and return images, detects damages using AI, identifies new vs. existing damage, and produces comprehensive inspection reports.

> Built as part of the Aspire Hiring Sprint

---

## 📌 Features

### 🔍 Damage Detection
- **Roboflow YOLO model** detects dents, scratches, broken parts, and severity levels
- **Bounding box overlays** drawn dynamically on images
- **Confidence scoring** for each detection

### 🔁 Pickup vs Return Comparison
- Automatically matches return photos with the closest pickup photo
- Distinguishes **new vs pre-existing damages**
- Per-image comparison summary

### 🧠 AI Narrative (Qwen Vision-Language Model)
- **Qwen2.5-VL-7B-Instruct** generates natural language descriptions of detected damage
- Summarizes severity and affected components
- Vision-language understanding for context-aware analysis

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

## 🔗 URLs

| Service | Development | Production |
|---------|-------------|------------|
| Frontend (Next.js) | http://localhost:3000 | Deployed on Vercel |
| Backend (Express API) | http://localhost:4000 | Deployed on Render |
| Swagger API Docs | http://localhost:4000/api-docs | [Backend URL]/api-docs |

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
- **Roboflow YOLO** API for damage detection
- **Qwen2.5-VL-7B-Instruct** (Qwen Vision-Language Model v2) for AI-generated damage descriptions
- Custom comparison + scoring engine
- **OpenAPI** (Swagger UI) documentation
- **Axios** for HTTP requests
- **CORS** enabled

---

## 📁 Project Structure

```
smartdamage-inspector/
└── apps/
    ├── backend/
    │   ├── docs/
    │   │   └── openapi.yaml
    │   ├── node_modules/
    │   ├── src/
    │   │   ├── config/
    │   │   ├── controllers/
    │   │   ├── routes/
    │   │   ├── services/
    │   │   ├── app.js
    │   │   └── server.js
    │   ├── .env
    │   ├── swagger.js
    │   └── package.json
    │
    └── frontend/
        ├── node_modules/
        ├── src/
        │   └── app/
        │       ├── components/
        │       ├── lib/
        │       │   └── api/
        │       ├── types/
        │       ├── page.tsx
        │       └── page.test.tsx
        ├── package.json
        └── next.config.js
```

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/Mz876/Hiring-Sprint-2025.git
cd Hiring-Sprint-2025/apps
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
NODE_ENV=development

# Hugging Face API (for Qwen model)
HF_API_KEY=your_huggingface_api_key_here
QWEN_API_URL=your_qwen_api_url_here
QWEN_API_KEY=your_qwen_api_key_here

# Roboflow YOLO Detection
ROBOFLOW_API_KEY=your_roboflow_key_here
ROBOFLOW_MODEL_ID=car-damage-c1f0i
ROBOFLOW_MODEL_VERSION=1
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

- **Roboflow YOLO** detections depend on off-the-shelf model accuracy
- **Current model optimized for exterior damage only** - interior detection accuracy is limited
- **Qwen2.5-VL-7B** descriptions depend on vision-language model capabilities
- Not optimized for extreme angles or night photos
- No image storage (in-memory only)
- Image pairing uses perceptual hashing (not perfect)
- Repair cost model is heuristic and not region-specific
- No vehicle-specific pricing based on make, model, or year
- Generic cost estimates without real market data integration

---

## 🌱 Future Improvements

- [ ] Fine-tuned YOLO on vehicle damage dataset
- [ ] Persistent storage (S3 or Supabase)
- [ ] User accounts + authentication
- [ ] Higher accuracy pickup-return matching
- [ ] More detailed severity & cost model
- [ ] Offline mobile version with Expo
- [ ] CI/CD pipeline
- [ ] Automated testing suite

---

---

**Made with ❤️ for the Aspire Hiring Sprint**