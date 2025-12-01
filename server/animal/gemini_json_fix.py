"""
Helper functions to fix malformed JSON from Gemini API
"""
import json
import re


def repair_json(json_string: str) -> dict:
    """
    Repair malformed JSON from Gemini API responses.
    Handles:
    - Unterminated strings
    - Truncated responses
    - Unescaped newlines
    - Missing closing brackets/braces
    """
    try:
        # First, try normal parsing
        return json.loads(json_string)
    except json.JSONDecodeError:
        pass
    
    # Find JSON boundaries
    start = json_string.find('{')
    end = json_string.rfind('}')
    
    if start == -1 or end <= start:
        raise ValueError("No valid JSON structure found")
    
    json_text = json_string[start:end+1]
    
    # Fix 1: Remove incomplete string entries in arrays
    # Pattern: "item1", "item2", "incomplete_string
    json_text = re.sub(r',\s*"[^"]*$', '', json_text, flags=re.MULTILINE)
    
    # Fix 2: Close incomplete strings before brackets/braces
    lines = json_text.split('\n')
    fixed_lines = []
    
    for line in lines:
        # If line has unclosed quotes and is not the last line
        quote_count = line.count('"')
        if quote_count % 2 != 0:  # Odd number of quotes = unclosed string
            # Check if this is an incomplete entry
            if line.strip().endswith('"') and '"' in line:
                # Might be okay - keep it
                pass
            elif '"' in line and not line.strip().endswith('"'):
                # Remove incomplete string at end
                # Find last complete string entry
                parts = line.split('"')
                if len(parts) >= 3:
                    # Keep only complete parts
                    line = '"'.join(parts[:-1]) + '"' if parts[-1].strip() else '"'.join(parts[:-2]) + '"'
        
        fixed_lines.append(line)
    
    json_text = '\n'.join(fixed_lines)
    
    # Fix 3: Remove trailing incomplete entries
    json_text = re.sub(r',\s*"[^"]*$', '', json_text, flags=re.MULTILINE)
    
    # Fix 4: Ensure arrays are closed
    open_brackets = json_text.count('[')
    close_brackets = json_text.count(']')
    if open_brackets > close_brackets:
        # Find last open bracket and add closing brackets
        last_open = json_text.rfind('[')
        if last_open != -1:
            json_text = json_text[:last_open] + json_text[last_open:] + ']' * (open_brackets - close_brackets)
    
    # Fix 5: Ensure object is closed
    if not json_text.strip().endswith('}'):
        json_text = json_text.rstrip().rstrip(',') + '\n}'
    
    # Try parsing again
    try:
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        # Last resort: try to extract valid parts and reconstruct
        try:
            # Extract just the fields we need
            result = {}
            
            # Extract name
            name_match = re.search(r'"name"\s*:\s*"([^"]*)"', json_text)
            if name_match:
                result['name'] = name_match.group(1)
            
            # Extract severity
            severity_match = re.search(r'"severity"\s*:\s*"([^"]*)"', json_text)
            if severity_match:
                result['severity'] = severity_match.group(1)
            
            # Extract arrays
            for field in ['symptoms', 'treatment', 'prevention', 'antibiotics']:
                array_match = re.search(rf'"{field}"\s*:\s*\[(.*?)\]', json_text, re.DOTALL)
                if array_match:
                    array_content = array_match.group(1)
                    # Extract individual string items
                    items = re.findall(r'"([^"]*)"', array_content)
                    result[field] = items if items else []
                else:
                    result[field] = []
            
            # Extract contagious
            contagious_match = re.search(r'"contagious"\s*:\s*(true|false)', json_text)
            if contagious_match:
                result['contagious'] = contagious_match.group(1) == 'true'
            else:
                result['contagious'] = False
            
            return result
        except Exception:
            raise ValueError(f"Could not repair JSON: {e}")


def safe_parse_gemini_response(response_text: str) -> dict:
    """
    Safely parse Gemini API response, handling various error cases.
    """
    # Clean response
    response_text = response_text.strip()
    if response_text.startswith('```json'):
        response_text = response_text[7:]
    elif response_text.startswith('```'):
        response_text = response_text[3:]
    if response_text.endswith('```'):
        response_text = response_text[:-3]
    response_text = response_text.strip()
    
    # Try normal parsing first
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        # Try repair
        return repair_json(response_text)

