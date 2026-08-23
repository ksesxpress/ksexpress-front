import os
import re

components_dir = "/Users/dolphfi/Downloads/ksexp/ksexpress-front/components/staff/admin/users"

for filename in os.listdir(components_dir):
    if not filename.endswith(".tsx"):
        continue
        
    filepath = os.path.join(components_dir, filename)
    with open(filepath, "r") as f:
        content = f.read()
        
    original = content
    # Remove bg-[#...]
    content = re.sub(r'!?bg-\[[^\]]+\](?:/\d+)?\s*', '', content)
    # Remove border-white/10
    content = re.sub(r'border(?:-white/10| border-white/10| border-none)\s*', '', content)
    # Remove shadow-2xl
    content = re.sub(r'shadow-(?:xl|2xl)\s*', '', content)
    # Remove text-slate-200
    content = re.sub(r'text-(?:brand-dark|slate-[0-9]+)\s*', '', content)
    # Remove p-0
    content = re.sub(r'\bp-0\b\s*', '', content)
    # Remove rounded-xl
    content = re.sub(r'rounded-(?:\[16px\]|xl|\[12px\])\s*', '', content)
    
    # Fix double spaces in class names and empty classNames
    content = re.sub(r'className="([^"]+)"', lambda m: 'className="' + ' '.join(m.group(1).split()) + '"', content)
    content = content.replace(' className=""', '')
    
    if content != original:
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Updated {filename}")

