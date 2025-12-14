
import os
import base64
import re

def main():
    print("Bundling game into single file...")
    
    # Read index.html
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
    except Exception as e:
        print(f"Error reading index.html: {e}")
        return

    # 1. Embed CSS
    # Find <link rel="stylesheet" href="style.css">
    css_pattern = re.compile(r'<link rel="stylesheet" href="(.*?)">')
    
    def replace_css(match):
        css_file = match.group(1)
        try:
            with open(css_file, 'r', encoding='utf-8') as f:
                css_content = f.read()
            return f'<style>\n{css_content}\n</style>'
        except Exception as e:
            print(f"Error embedding CSS {css_file}: {e}")
            return match.group(0)

    html_content = css_pattern.sub(replace_css, html_content)

    # 2. Generate Assets Bundle (Base64)
    assets_dir = 'assets'
    assets_js = "window.ASSETS = {};\n"
    
    if os.path.exists(assets_dir):
        for root, dirs, files in os.walk(assets_dir):
            for file in files:
                file_path = os.path.join(root, file)
                # Determine mime type
                ext = file.split('.')[-1].lower()
                mime = 'application/octet-stream'
                if ext == 'png': mime = 'image/png'
                elif ext == 'jpg' or ext == 'jpeg': mime = 'image/jpeg'
                elif ext == 'wav': mime = 'audio/wav'
                elif ext == 'mp3': mime = 'audio/mpeg'
                
                try:
                    with open(file_path, 'rb') as f:
                        data = f.read()
                        b64 = base64.b64encode(data).decode('utf-8')
                        data_uri = f'data:{mime};base64,{b64}'
                        # Store by filename (e.g. 'player.png')
                        # Note: getAsset uses simple filename lookup
                        assets_js += f'window.ASSETS["{file}"] = "{data_uri}";\n'
                        print(f"Embedded {file}")
                except Exception as e:
                    print(f"Error embedding asset {file}: {e}")
    else:
        print("Assets directory not found.")

    # 3. Embed JS
    # Find <script src="..."> or <script type="module" src="...">
    script_pattern = re.compile(r'<script.*?\ssrc="(.*?)".*?></script>')
    
    def replace_js(match):
        full_tag = match.group(0)
        js_file = match.group(1)
        
        is_module = 'type="module"' in full_tag or "type='module'" in full_tag
        tag_start = '<script type="module">' if is_module else '<script>'
        
        try:
            with open(js_file, 'r', encoding='utf-8') as f:
                js_content = f.read()
            return f'{tag_start}\n{js_content}\n</script>'
        except Exception as e:
            print(f"Error embedding JS {js_file}: {e}")
            return match.group(0)

    html_content = script_pattern.sub(replace_js, html_content)

    # Inject Assets Bundle before the first script
    assets_script_tag = f'<script>\n{assets_js}\n</script>\n'
    
    # Insert before the first script tag (which is now likely inlined or check structure)
    # Actually, we should insert it early.
    # index.html structure has scripts at bottom.
    # let's insert it before the first <script> occurrence.
    first_script_idx = html_content.find('<script>')
    if first_script_idx != -1:
        html_content = html_content[:first_script_idx] + assets_script_tag + html_content[first_script_idx:]
    else:
        # If no scripts (unlikely), append to body
        html_content = html_content.replace('</body>', f'{assets_script_tag}</body>')

    # Write output
    output_filename = 'bzbzbz_tek_dosya.html'
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"Successfully created {output_filename}")
    except Exception as e:
        print(f"Error writing output file: {e}")

if __name__ == "__main__":
    main()
