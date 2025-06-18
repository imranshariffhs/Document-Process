from langchain_google_genai import GoogleGenerativeAI
from langchain_community.document_loaders import PyPDFLoader
from langchain.prompts import PromptTemplate
from langchain.chains import create_extraction_chain
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv
import json
import logging
import warnings
from cryptography.utils import CryptographyDeprecationWarning
from utils.extract_pdf_data import process_pdf_image

# Filter out the cryptography deprecation warning
warnings.filterwarnings('ignore', category=CryptographyDeprecationWarning)

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# LangChain configuration
llm = GoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=os.getenv('GEMINI_API_KEY'),
    temperature=0.7,
    top_p=0.98,
    top_k=20,
    max_output_tokens=8192
)

# Create a PromptTemplate for extraction
EXTRACTION_PROMPT = """You are an expert data extraction assistant. Your task is to extract data from PDF documents and return it in JSON format.

FIELD DEFINITIONS:
{field_definitions}

DOCUMENT CONTENT:
{pdf_text}

INSTRUCTIONS:
1. Extract data for each field defined above
2. Return ONLY a JSON object - no other text or formatting
3. Use null for missing or empty values
4. Use exact field names from the definitions

RESPONSE FORMAT:
Return only a JSON object like this (using actual field names from definitions):
{{
    "actual_field_name1": "value1",
    "actual_field_name2": null,
    "actual_field_name3": ["value1", "value2"]
}}
"""

def format_field_definitions(field_definitions):
    """Format field definitions for the prompt"""
    field_def_text = "\n"
    for i, field in enumerate(field_definitions, 1):
        name = field.get('name', '').lower()
        description = field.get('description', '')
        field_def_text += f"        {i}. {name}: Location: {description}\n"
        field_def_text += "           If not marked, return null\n\n"
    return field_def_text.strip()

def extract_json_from_response(response_text):
    """Extract JSON from response text with improved error handling"""
    try:
        # If already a dict, return as is
        if isinstance(response_text, dict):
            return response_text

        # Convert response to string if needed
        if not isinstance(response_text, str):
            response_text = str(response_text)

        # Clean up the text
        text = response_text.strip()
        
        try:
            # Try direct JSON parsing first
            return json.loads(text)
        except:
            # Find the first { and last }
            start = text.find('{')
            end = text.rfind('}')
            
            if start != -1 and end != -1:
                # Extract just the JSON part
                json_text = text[start:end+1]
                
                # Clean up common issues
                json_text = json_text.replace('\n', ' ')
                json_text = json_text.replace('\r', ' ')
                json_text = ' '.join(json_text.split())  # Normalize whitespace
                json_text = json_text.replace("'", '"')  # Replace single quotes
                
                try:
                    return json.loads(json_text)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON: {e}")
                    logger.error(f"Attempted to parse: {json_text}")
                    return {}
            
            logger.error("No JSON object found in response")
            logger.error(f"Response text: {text}")
            return {}

    except Exception as e:
        logger.error(f"Error in extract_json_from_response: {str(e)}")
        logger.error(f"Response text: {response_text}")
        return {}

def process_single_pdf(file_path, field_definitions):
    """Process a single PDF file using LangChain with Google Gemini"""
    try:
        # Debug: Print current working directory
        cwd = os.getcwd()
        print(f"Current working directory: {cwd}")
        
        # Get the absolute path to the backend directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        print(f"Backend directory: {current_dir}")
        
        # Handle both Windows and Unix-style paths
        file_name = os.path.basename(file_path.replace('\\', '/'))
        pdf_path = os.path.join(current_dir, 'uploads', file_name)
        pdf_path = os.path.abspath(os.path.normpath(pdf_path))
        print(f"Input PDF path: {pdf_path}")
        
        # Verify PDF exists
        if not os.path.isfile(pdf_path):
            error_msg = f"PDF file not found: {pdf_path}"
            print(error_msg)
            logger.error(error_msg)
            return {
                'status': 'error',
                'data': {field.get('name', ''): None for field in field_definitions},
                'file_path': file_path,
                'error': 'PDF file not found'
            }
        
        # Change to the utils directory before processing
        utils_dir = os.path.join(current_dir, 'utils')
        os.chdir(utils_dir)
        print(f"Changed working directory to: {os.getcwd()}")
        
        # Process the PDF and get the output folder path
        output_folder = process_pdf_image(pdf_path)
        print(f"Received output folder path: {output_folder}")
        
        if not output_folder:
            error_msg = "Failed to process PDF images"
            print(error_msg)
            logger.error(error_msg)
            return {
                'status': 'error',
                'data': {field.get('name', ''): None for field in field_definitions},
                'file_path': file_path,
                'error': error_msg
            }
            
        # Verify the output folder exists
        if not os.path.isdir(output_folder):
            error_msg = f"Output folder not found: {output_folder}"
            print(error_msg)
            logger.error(error_msg)
            return {
                'status': 'error',
                'data': {field.get('name', ''): None for field in field_definitions},
                'file_path': file_path,
                'error': 'Output folder not found'
            }
            
        # Construct the path to the output markdown file
        output_path = os.path.join(output_folder, 'output_all_pages.md')
        output_path = os.path.abspath(os.path.normpath(output_path))
        print(f"Looking for output file at: {output_path}")

        # Verify the file exists
        if not os.path.isfile(output_path):
            error_msg = f"File not found: {output_path}"
            print(error_msg)
            logger.error(error_msg)
            return {
                'status': 'error',
                'data': {field.get('name', ''): None for field in field_definitions},
                'file_path': file_path,
                'error': 'PDF text file not found'
            }

        try:
            print(f"Attempting to read file: {output_path}")
            with open(output_path, 'r', encoding='utf-8') as file:
                pdf_text = file.read()
            print(f"Successfully read {len(pdf_text)} characters from file")
            
        except Exception as e:
            error_msg = f"Error reading file {output_path}: {str(e)}"
            print(error_msg)
            logger.error(error_msg)
            return {
                'status': 'error',
                'data': {field.get('name', ''): None for field in field_definitions},
                'file_path': file_path,
                'error': f'Error reading PDF text file: {str(e)}'
            }

        # Format field definitions
        field_def_text = format_field_definitions(field_definitions)
        
        # Create the prompt with the content
        prompt = EXTRACTION_PROMPT.format(
            field_definitions=field_def_text,
            pdf_text=pdf_text
        )
        
        # Get response from LLM
        try:
            response = llm.invoke(prompt)
            logger.info(f"Raw LLM response: {response}")
        except Exception as e:
            error_msg = f"Error getting LLM response: {str(e)}"
            print(error_msg)
            logger.error(error_msg)
            return {
                'status': 'error',
                'data': {field.get('name', ''): None for field in field_definitions},
                'file_path': file_path,
                'error': error_msg
            }
        
        # Extract JSON from response
        extraction_json_data = extract_json_from_response(response)
        
        if not extraction_json_data:
            error_msg = "Failed to extract valid JSON from LLM response"
            logger.error(error_msg)
            return {
                'status': 'error',
                'data': {field.get('name', ''): None for field in field_definitions},
                'file_path': file_path,
                'error': error_msg
            }
        
        logger.info(f"Successfully processed PDF: {file_path}")
        logger.info(f"Extracted data: {extraction_json_data}")
        
        return {
            'status': 'success',
            'data': extraction_json_data,
            'file_path': file_path
        }
        
    except Exception as e:
        error_msg = f"Error processing PDF {file_path}: {str(e)}"
        print(error_msg)
        logger.error(error_msg)
        return {
            'status': 'error',
            'data': {field.get('name', ''): None for field in field_definitions},
            'file_path': file_path,
            'error': str(e)
        }

# Legacy function for backward compatibility
def process_pdf(file_path):
    """Legacy function - use process_single_pdf instead"""
    logger.warning("process_pdf is deprecated, use process_single_pdf instead")
    return process_single_pdf(file_path, [])