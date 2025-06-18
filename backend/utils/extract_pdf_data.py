import os
import base64
import time
import json
from pdf2image import convert_from_path
from PIL import Image
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

# ---------- 1. Configuration ----------

# pdf_path = 'pdf/Enquiry form - Gulf Additives (Revised 11112024).pdf'
os.environ["GOOGLE_API_KEY"] = "AIzaSyA-gySicYa7WFTKWQXz0gZzCahZNn8T0-8"  # Replace with your actual key
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

# ---------- 2. Enhanced PDF to Image Conversion ----------

def pdf_to_image(upload_path):
    """
    Convert an uploaded PDF to images.
    - Validates the path.
    - Creates output folder under /image/{filename}/
    - Saves one PNG per page.
    Returns:
    - String: Path to the folder containing the images and markdown file
    """
    try:
        # Debug: Print current working directory
        cwd = os.getcwd()
        print(f"Current working directory: {cwd}")
        
        # Normalize paths
        upload_path = os.path.abspath(os.path.normpath(upload_path))
        print(f"Normalized upload path: {upload_path}")
        
        # Get the base filename without extension
        filename = os.path.splitext(os.path.basename(upload_path))[0]
        print(f"Base filename: {filename}")
        
        # Create output folder path
        output_folder = os.path.join('image', filename)
        abs_output_folder = os.path.abspath(output_folder)
        print(f"Creating output folder at: {abs_output_folder}")
        
        # Create output folder
        os.makedirs(abs_output_folder, exist_ok=True)
        print(f"Created output folder at: {abs_output_folder}")

        print(f"📄 Converting PDF to images: {upload_path}")
        
        # Convert PDF to images
        images = convert_from_path(upload_path, dpi=300)
        print(f"Converted {len(images)} pages")
        
        if not images:
            raise ValueError("❌ No pages found in PDF")

        # Save images
        for i, img in enumerate(images):
            output_path = os.path.join(abs_output_folder, f'page_{i + 1}.png')
            img.save(output_path, 'PNG')
            print(f"✅ Saved page {i+1} to: {output_path}")

        # Create markdown file
        output_md_path = os.path.join(abs_output_folder, "output_all_pages.md")
        print(f"Creating markdown file at: {output_md_path}")
        
        with open(output_md_path, "w", encoding="utf-8") as f:
            f.write(f"# PDF Processing Results\n\nProcessing {filename}\n\n")
            
        print(f"✅ Created markdown file at: {output_md_path}")
        print(f"✅ All files saved in folder: {abs_output_folder}")

        # Return absolute folder path
        print(f"Returning folder path: {abs_output_folder}")
        return abs_output_folder

    except Exception as e:
        print(f"❌ Error during conversion: {str(e)}")
        raise

# ---------- 3. Enhanced Gemini Extraction with Retry Logic ----------

def load_image_bytes(image_path):
    """Load image with validation"""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")
    
    if os.path.getsize(image_path) == 0:
        raise ValueError(f"Image file is empty: {image_path}")
    
    try:
        with open(image_path, "rb") as img_file:
            image_data = img_file.read()
            if not image_data:
                raise ValueError(f"No data read from image: {image_path}")
            return base64.b64encode(image_data).decode("utf-8")
    except Exception as e:
        print(f"❌ Error loading image {image_path}: {str(e)}")
        raise

def extract_image_to_markdown(image_path, max_retries=3):
    """Extract with retry logic and content validation"""
    
    # Enhanced prompt specifically for radio button and checkbox detection
    enhanced_prompt = """
    Extract ALL content from this image and format it in clean, structured Markdown. 
    
    IMPORTANT: Do not skip any text, fields, or form elements. Extract everything visible.
    
    CRITICAL: Pay special attention to radio buttons, checkboxes, and form selections:
    
    **For CHECKBOXES:**
    - When a checkbox is CHECKED/FILLED/SELECTED: Format as `select[X] Option Text`
    - When a checkbox is UNCHECKED/EMPTY: Format as `unselect[] Option Text`
    - Look carefully for visual indicators like checkmarks, X marks, filled squares, or darker boxes
    - Include ALL checkbox options (both checked and unchecked) with their proper formatting
    
    **For RADIO BUTTONS:**
    - ONLY extract the option that is SELECTED/FILLED/CHECKED
    - Look for filled circles (●), dots, or darker/highlighted options
    - If a radio button is empty/unfilled/unchecked, do NOT include it in the output
    - Format as: **Question:** Selected Answer Only
    
    **For TEXT FIELDS and OTHER CONTENT:**
    - Extract ALL visible text including headers, labels, instructions
    - Include any handwritten or filled-in text
    - Preserve table structures, lists, and formatting
    - Include field labels even if fields are empty
    - Extract signatures, dates, and any other visible content
    
    **For other form elements:**
    - Dropdown selections: Include the selected value if visible
    - Text areas: Include any filled-in text
    - Preserve the exact text of all options and content
    
    Format guidelines:
    - Use clear headings for sections
    - For form fields, use format: **Field Name:** Value (or empty if blank)
    - For checkbox groups, list all options with proper select[X]/unselect[] formatting
    - Maintain the logical structure and flow of the document
    - Include page numbers, headers, footers if present
    
    EXTRACT EVERYTHING - missing content is worse than including too much.
    """
    
    for attempt in range(max_retries):
        try:
            print(f"🔄 Attempt {attempt + 1}/{max_retries} for {os.path.basename(image_path)}")
            
            image_base64 = load_image_bytes(image_path)
            
            response = llm.invoke([
                HumanMessage(content=[
                    {"type": "text", "text": enhanced_prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}}
                ])
            ])
            
            content = response.content
            
            # Validate response content
            if not content or len(content.strip()) < 10:
                raise ValueError(f"Response too short or empty: {len(content) if content else 0} characters")
            
            # Check for common extraction failures
            if "unable to" in content.lower() or "cannot extract" in content.lower():
                raise ValueError("Extraction failed - model reported inability to process")
            
            print(f"✅ Successfully extracted {len(content)} characters")
            return content
            
        except Exception as e:
            print(f"⚠️ Attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2  # Progressive backoff
                print(f"⏳ Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
            else:
                print(f"❌ All attempts failed for {image_path}")
                # Return a placeholder to prevent complete data loss
                return f"# Error Processing {os.path.basename(image_path)}\n\n*Failed to extract content after {max_retries} attempts.*\n\n**Error:** {str(e)}\n"

# ---------- 5. Enhanced Main Process with Data Loss Prevention ----------

def save_progress(all_markdown, output_file):
    """Save current progress to prevent data loss"""
    try:
        # Create directory if it doesn't exist
        output_dir = os.path.dirname(output_file)
        os.makedirs(output_dir, exist_ok=True)
        
        with open(output_file, "w", encoding="utf-8") as f:
            f.writelines(all_markdown)
        return True
    except Exception as e:
        print(f"❌ Error saving progress: {str(e)}")
        return False

def process_pdf_image(pdf_path):
    """Process PDF with comprehensive error handling and data preservation"""
    
    # Validate inputs
    # if not os.path.exists(pdf_path):
    #     print(f"❌ PDF file not found: {pdf_path}")
    #     return None
    
    # Check API key
    if not os.environ.get("GOOGLE_API_KEY"):
        print("❌ GOOGLE_API_KEY not set in environment variables")
        return None
    
    try:
        image_folder = pdf_to_image(pdf_path)
        abs_image_folder = os.path.abspath(image_folder)
        print(f"Working with image folder: {abs_image_folder}")
    except Exception as e:
        print(f"❌ Failed to convert PDF to images: {str(e)}")
        return None
    
    # Get all image files and validate
    if not os.path.exists(abs_image_folder):
        print(f"❌ Image folder not found: {abs_image_folder}")
        return None

    image_files = [f for f in sorted(os.listdir(abs_image_folder)) 
                   if f.endswith(".png") and f.startswith("page_")]
    
    if not image_files:
        print(f"❌ No page images found in {abs_image_folder}")
        return None
    
    print(f"📋 Found {len(image_files)} pages to process")
    
    # Set up output paths
    output_file = os.path.join(abs_image_folder, "output_all_pages.md")
    temp_output_file = os.path.join(abs_image_folder, "temp_output_all_pages.md")
    
    print(f"Output will be saved to: {output_file}")
    processed_count = 0
    failed_count = 0
    all_markdown = []
    
    # Process each page
    for i, filename in enumerate(image_files, 1):
        image_path = os.path.join(abs_image_folder, filename)
        
        print(f"\n🔍 Processing {i}/{len(image_files)}: {filename}")
        
        try:
            # Validate image file exists and has content
            if not os.path.exists(image_path):
                print(f"⚠️ Image file missing: {filename}")
                failed_count += 1
                continue
                
            if os.path.getsize(image_path) == 0:
                print(f"⚠️ Image file is empty: {filename}")
                failed_count += 1
                continue
            
            # Extract content
            markdown_text = extract_image_to_markdown(image_path)
            
            # Validate extracted content
            if not markdown_text or len(markdown_text.strip()) < 5:
                print(f"⚠️ Warning: Very little content extracted from {filename}")
            
            # Add to results
            page_content = f"## {filename}\n\n{markdown_text}\n\n---\n\n"
            all_markdown.append(page_content)
            processed_count += 1
            
            print(f"✅ Completed: {filename} ({len(markdown_text)} characters)")
            
            # Save progress every 3 pages to prevent data loss
            if i % 3 == 0:
                if save_progress(all_markdown, temp_output_file):
                    print(f"💾 Progress saved (processed {processed_count} pages)")
                
        except KeyboardInterrupt:
            print(f"\n⚠️ Process interrupted by user")
            print(f"💾 Saving progress for {processed_count} completed pages...")
            break
            
        except Exception as e:
            print(f"❌ Error processing {filename}: {str(e)}")
            failed_count += 1
            
            # Add error placeholder to maintain page order
            error_content = f"## {filename}\n\n*Error processing this page: {str(e)}*\n\n---\n\n"
            all_markdown.append(error_content)
            continue

    # Final save
    if all_markdown:
        try:
            with open(output_file, "w", encoding="utf-8") as f:
                # Add summary header
                summary = f"""# PDF Extraction Summary
                                **File:** {pdf_path}
                                **Total Pages:** {len(image_files)}
                                **Successfully Processed:** {processed_count}
                                **Failed:** {failed_count}
                                **Extraction Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}
                                ---
                        """
                f.write(summary)
                f.writelines(all_markdown)
                
            print(f"\n✅ Final output saved to '{output_file}'")
            print(f"📊 Summary: {processed_count} successful, {failed_count} failed out of {len(image_files)} total pages")
            
            # Clean up temp file
            if os.path.exists(temp_output_file):
                os.remove(temp_output_file)
                
            # Return absolute path to the folder
            return abs_image_folder
            
        except Exception as e:
            print(f"❌ Error saving final output: {str(e)}")
            return None
    else:
        print("❌ No content was successfully extracted")
        return None

# ---------- 6. Main Execution ----------

# if __name__ == "__main__":
#     #pdf_path = 'Enquiry form - Gulf Additives (Revised 11112024).pdf'
#     current_dir = os.path.dirname(os.path.abspath(__file__))
#     pdf_relative_path = os.path.join(current_dir, '..', 'uploads', '1f2b2dcc-be85-4d8a-afed-5003f7635c7a_Enquiry_form_-_Gulf_Additives_Revised_11112024.pdf')
#     pdf_path = os.path.normpath(pdf_relative_path)

#     #pdf_path = 'demo_app/backend/uploads/1f2b2dcc-be85-4d8a-afed-5003f7635c7a_Enquiry_form_-_Gulf_Additives_Revised_11112024.pdf'
#     print(pdf_path)
#     process_pdf_image(pdf_path)