import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    from pypdf import PdfReader
    reader = PdfReader(r"C:\Users\Nipun\Downloads\Xpo_Tech_Candidate_Assessment.docx.pdf")
    
    # Extract pages 1-5 which contain the key requirements
    for i, page in enumerate(reader.pages):
        t = page.extract_text()
        if t:
            print(f"\n{'='*80}")
            print(f"PAGE {i+1}")
            print(f"{'='*80}")
            print(t)
    
    print(f"\n--- TOTAL PAGES: {len(reader.pages)} ---")
except Exception as e:
    print(f"Error: {e}")
