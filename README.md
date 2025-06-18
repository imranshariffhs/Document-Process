# Document Processing POC

A modern web application for processing and extracting data from PDF documents using AI-powered analysis. This project demonstrates automated document processing capabilities with a user-friendly interface.

## 🌟 Features

- PDF document upload and processing
- Dynamic schema management for data extraction
- AI-powered document analysis
- Real-time processing status updates
- Results viewing and export functionality
- Modern, responsive user interface
- RESTful API backend

## 🛠️ Technology Stack

### Backend
- Python 3.x
- Flask (Web Framework)
- LangChain (AI/ML Processing)
- Google Generative AI
- PyPDF (PDF Processing)
- ChromaDB & FAISS (Vector Database)

### Frontend
- Next.js
- React
- Material-UI (MUI)
- React Hot Toast (Notifications)

## 📋 Prerequisites

- Python 3.x
- Node.js and npm
- Google Cloud API credentials (for AI features)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/steer_document_processing_poc.git
cd steer_document_processing_poc
```

### 2. Backend Setup

```bash
cd demo_app/backend

# Create and activate virtual environment (Windows)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create a .env file with your Google Cloud API credentials
```

### 3. Frontend Setup

```bash
cd demo_app/frontend

# Install dependencies
npm install

# Create environment file
cp env_local_example.txt .env.local
# Update the API endpoint in .env.local if needed
```

### 4. Running the Application

For Windows users, use the provided batch files:

```bash
# Start the backend server
start_backend.bat

# Start the frontend development server
start_frontend.bat
```

For manual startup:

Backend:
```bash
cd demo_app/backend
flask run
```

Frontend:
```bash
cd demo_app/frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔄 Workflow

1. **Upload PDF**: Start by uploading your PDF document
2. **Select Schema**: Choose or create a schema for data extraction
3. **Process Document**: Initiate the AI-powered document analysis
4. **View Results**: Review extracted data and export results

## 📁 Project Structure

```
demo_app/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── pdf_process.py         # PDF processing logic
│   ├── utils/                 # Utility functions
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js application
│   │   ├── components/       # React components
│   │   └── services/         # API services
│   └── package.json          # Node.js dependencies
└── sample_docs/              # Sample documents for testing
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Cloud Platform for AI capabilities
- The open-source community for the amazing tools and libraries