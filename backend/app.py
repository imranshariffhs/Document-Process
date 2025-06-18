import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
import uuid
from datetime import datetime
import pandas as pd
from io import BytesIO
from pdf_process import process_single_pdf
import warnings

app = Flask(__name__)
CORS(app)

# Environment configuration
ENV = os.getenv('FLASK_ENV', 'production')  # Default to production
DEBUG = os.getenv('FLASK_DEBUG', '0').lower() in ('true', '1', 't')  # Default to False

if DEBUG:
    warnings.warn(
        'WARNING: Debug mode is enabled. This is insecure and should not be used in production!',
        RuntimeWarning
    )

# Configuration
UPLOAD_FOLDER = os.path.abspath('uploads')
SCHEMAS_FOLDER = os.path.abspath('schemas')
RESULTS_FOLDER = os.path.abspath('results')
ALLOWED_EXTENSIONS = {'pdf'}

# Create necessary directories
for folder in [UPLOAD_FOLDER, SCHEMAS_FOLDER, RESULTS_FOLDER]:
    os.makedirs(folder, exist_ok=True)
    print(f"Created/verified directory: {folder}")

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'PDF Processing API is running'})

@app.route('/api/upload', methods=['POST'])
def upload_files():
    try:
        # Ensure upload directory exists
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if not file or not file.filename:
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        session_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        unique_filename = f"{session_id}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        print(f"Saving file to: {filepath}")
        file.save(filepath)
        
        if not os.path.exists(filepath):
            return jsonify({'error': f'Failed to save file to {filepath}'}), 500
            
        uploaded_file = {
            'original_name': filename,
            'stored_name': unique_filename,
            'size': os.path.getsize(filepath)
        }
        
        return jsonify({
            'session_id': session_id,
            'file': uploaded_file,
            'message': 'File uploaded successfully'
        })
    
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/schemas', methods=['GET'])
def get_schemas():
    try:
        schemas = []
        if os.path.exists(SCHEMAS_FOLDER):
            for filename in os.listdir(SCHEMAS_FOLDER):
                if filename.endswith('.json'):
                    with open(os.path.join(SCHEMAS_FOLDER, filename), 'r') as f:
                        schema = json.load(f)
                        schemas.append(schema)
        
        return jsonify({'schemas': schemas})
    
    except Exception as e:
        return jsonify({'error': f'Failed to fetch schemas: {str(e)}'}), 500

@app.route('/api/schemas', methods=['POST'])
def create_schema():
    try:
        data = request.get_json()
        
        if not data or 'name' not in data or 'fields' not in data:
            return jsonify({'error': 'Schema name and fields are required'}), 400
        
        schema_id = str(uuid.uuid4())
        schema = {
            'id': schema_id,
            'name': data['name'],
            'description': data.get('description', ''),
            'fields': data['fields'],
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        schema_file = os.path.join(SCHEMAS_FOLDER, f'{schema_id}.json')
        with open(schema_file, 'w') as f:
            json.dump(schema, f, indent=2)
        
        return jsonify({'schema': schema, 'message': 'Schema created successfully'})
    
    except Exception as e:
        return jsonify({'error': f'Failed to create schema: {str(e)}'}), 500

@app.route('/api/schemas/<schema_id>', methods=['PUT'])
def update_schema(schema_id):
    try:
        data = request.get_json()
        schema_file = os.path.join(SCHEMAS_FOLDER, f'{schema_id}.json')
        
        if not os.path.exists(schema_file):
            return jsonify({'error': 'Schema not found'}), 404
        
        with open(schema_file, 'r') as f:
            schema = json.load(f)
        
        schema.update({
            'name': data.get('name', schema['name']),
            'description': data.get('description', schema['description']),
            'fields': data.get('fields', schema['fields']),
            'updated_at': datetime.now().isoformat()
        })
        
        with open(schema_file, 'w') as f:
            json.dump(schema, f, indent=2)
        
        return jsonify({'schema': schema, 'message': 'Schema updated successfully'})
    
    except Exception as e:
        return jsonify({'error': f'Failed to update schema: {str(e)}'}), 500

@app.route('/api/schemas/<schema_id>', methods=['DELETE'])
def delete_schema(schema_id):
    try:
        schema_file = os.path.join(SCHEMAS_FOLDER, f'{schema_id}.json')
        
        if not os.path.exists(schema_file):
            return jsonify({'error': 'Schema not found'}), 404
        
        os.remove(schema_file)
        return jsonify({'message': 'Schema deleted successfully'})
    
    except Exception as e:
        return jsonify({'error': f'Failed to delete schema: {str(e)}'}), 500

@app.route('/api/process', methods=['POST'])
def process_pdfs():
    try:
        data = request.get_json()
        
        if not data or 'session_id' not in data or 'schema_id' not in data:
            return jsonify({'error': 'Session ID and Schema ID are required'}), 400
        
        session_id = data['session_id']
        schema_id = data['schema_id']
        
        # Ensure all required directories exist
        for folder in [UPLOAD_FOLDER, SCHEMAS_FOLDER, RESULTS_FOLDER]:
            os.makedirs(folder, exist_ok=True)
            print(f"Ensured directory exists: {folder}")
        
        # Load schema
        schema_file = os.path.join(SCHEMAS_FOLDER, f'{schema_id}.json')
        if not os.path.exists(schema_file):
            return jsonify({'error': 'Schema not found'}), 404
        
        with open(schema_file, 'r') as f:
            schema = json.load(f)
        
        # Get uploaded file (single file processing)
        uploaded_file = None
        for filename in os.listdir(UPLOAD_FOLDER):
            if filename.startswith(session_id):
                uploaded_file = os.path.join(UPLOAD_FOLDER, filename)
                break
        
        if not uploaded_file:
            return jsonify({'error': 'No file found for this session'}), 404

        print(f"Processing file: {uploaded_file}")
        print(f"With schema: {schema_id}")
        
        # Process the single PDF using the new single PDF processor
        result = process_single_pdf(uploaded_file, schema['fields'])
        
        if not result:
            return jsonify({'error': 'PDF processing failed'}), 500
            
        if result.get('status') == 'error':
            print(f"Error during PDF processing: {result.get('error', 'Unknown error')}")
            return jsonify({
                'error': 'An error occurred during PDF processing. Please try again later.'
            }), 500
            
        filename = os.path.basename(result['file_path']).replace(f'{session_id}_', '')
        
        results = [{
            'filename': filename,
            'data': result['data'],
            'status': result['status'],
            'error': result.get('error')
        }]
        
        # Save results
        result_id = str(uuid.uuid4())
        result_data = {
            'id': result_id,
            'session_id': session_id,
            'schema_id': schema_id,
            'schema_name': schema['name'],
            'results': results,
            'processed_at': datetime.now().isoformat()
        }
        
        # Ensure results directory exists and create result file
        result_file = os.path.join(RESULTS_FOLDER, f'{result_id}.json')
        result_dir = os.path.dirname(result_file)
        os.makedirs(result_dir, exist_ok=True)
        print(f"Saving results to: {result_file}")
        
        try:
            with open(result_file, 'w') as f:
                json.dump(result_data, f, indent=2)
            print(f"Successfully saved results to: {result_file}")
        except Exception as e:
            print(f"Error saving results: {str(e)}")
            return jsonify({
                'error': 'Failed to save results',
                'details': str(e)
            }), 500
        
        return jsonify(result_data), 200
        
    except Exception as e:
        print(f"Error in process_pdfs: {str(e)}")
        return jsonify({
            'error': 'An internal error has occurred. Please contact support if the issue persists.'
        }), 500

@app.route('/api/export/<result_id>', methods=['GET'])
def export_results(result_id):
    try:
        result_file = os.path.join(RESULTS_FOLDER, f'{result_id}.json')
        
        if not os.path.exists(result_file):
            return jsonify({'error': 'Results not found'}), 404
        
        with open(result_file, 'r') as f:
            result_data = json.load(f)
        
        # Create DataFrame
        rows = []
        for result in result_data['results']:
            if result['status'] == 'success':
                row = {'filename': result['filename']}
                row.update(result['data'])
                rows.append(row)
        
        if not rows:
            return jsonify({'error': 'No successful results to export'}), 400
        
        df = pd.DataFrame(rows)
        
        # Create Excel file in memory
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Extracted Data')
        
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'extracted_data_{result_id}.xlsx'
        )
    
    except Exception as e:
        return jsonify({'error': f'Export failed: {str(e)}'}), 500

@app.route('/api/reset/<session_id>', methods=['DELETE'])
def reset_session(session_id):
    try:
        # Remove uploaded file
        for filename in os.listdir(UPLOAD_FOLDER):
            if filename.startswith(session_id):
                os.remove(os.path.join(UPLOAD_FOLDER, filename))
        
        # Remove results
        for filename in os.listdir(RESULTS_FOLDER):
            if filename.endswith('.json'):
                with open(os.path.join(RESULTS_FOLDER, filename), 'r') as f:
                    result_data = json.load(f)
                    if result_data.get('session_id') == session_id:
                        os.remove(os.path.join(RESULTS_FOLDER, filename))
        
        return jsonify({'message': 'Session reset successfully'})
    
    except Exception as e:
        return jsonify({'error': f'Reset failed: {str(e)}'}), 500

if __name__ == '__main__':
    # Get port from environment variable with a default of 5000
    port = int(os.getenv('PORT', 5000))
    
    # In production, only bind to localhost
    host = '127.0.0.1' if ENV == 'production' else '0.0.0.0'
    
    app.run(
        debug=DEBUG,  # Controlled by FLASK_DEBUG env var
        host=host,    # Bind to localhost in production
        port=port     # Use PORT env var or default to 5000
    ) 