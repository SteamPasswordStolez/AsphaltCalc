import json
import os
import re
import urllib.request
import sys
import time

# Force UTF-8 output
try:
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')
except: pass

CARS_JSON_PATH = os.path.join(os.path.dirname(__file__), '../assets/cars.json')
WIKI_URL = "https://asphalt.fandom.com/wiki/Vehicle_list_(Asphalt_Legends)"

def fetch_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def main():
    print("--- Asphalt Legends Data Updater (Safe Restore) ---")
    
    # 1. Load existing
    try:
        with open(CARS_JSON_PATH, 'r', encoding='utf-8') as f:
            cars = json.load(f)
    except:
        cars = []

    # Map class to next class to define boundaries
    class_map = { 'D': 'Class_C', 'C': 'Class_B', 'B': 'Class_A', 'A': 'Class_S', 'S': 'toc' }
    classes = ['D', 'C', 'B', 'A', 'S']
    
    # 1. Fetch MAIN list
    print(f"Fetching Main List: {WIKI_URL}")
    html = fetch_url(WIKI_URL)
    if not html: return

    new_cars = []
    # Find max ID
    ids = [int(c.get('id', 0)) for c in cars]
    next_id = max(ids) + 1 if ids else 1000

    for cls in classes:
        print(f"Scanning Class {cls}...")
        start_marker = f'id="Class_{cls}"'
        start_idx = html.find(start_marker)
        if start_idx == -1: continue
        
        next_marker_key = class_map.get(cls)
        end_idx = html.find(f'id="{next_marker_key}"', start_idx)
        if end_idx == -1: end_idx = len(html)

        chunk = html[start_idx:end_idx]
        link_pattern = re.compile(r'href="(/wiki/([^":#]+))"[^>]*>([^<]+)</a>')
        
        matches = link_pattern.findall(chunk)
        unique_links = set()
        
        for link_path, raw_id, name in matches:
            name = name.replace('&amp;', '&').strip()
            if name in ['Edit', 'edit', 'Vehi', 'Class ' + cls]: continue
            if raw_id in unique_links: continue
            unique_links.add(raw_id)

            # Check if car exists
            existing_car = next((c for c in cars if c.get('name', '').lower() == name.lower()), None)
            target_car = existing_car
            is_new = False
            
            # CONDITION: If car missing OR has dummy stats (rank 4000) OR has < 3 stats entries (incomplete)
            needs_update = False
            if not target_car:
                is_new = True
                print(f"  [NEW] Found {name}")
                target_car = {
                    "id": next_id, "class": cls, "name": name, "max_star": 6,
                    "unlock_method": "bp", "fuel": 6, "bp_requirements": [], "stat": [],
                    "wiki_url": f"https://asphalt.fandom.com{link_path}"
                }
                next_id += 1
                needs_update = True
            else:
                # Check for bad data
                stats = target_car.get('stat', [])
                if not stats: needs_update = True
                elif stats[0].get('rank') == 4000: needs_update = True
                # Also force update if stats seem to have 0 speed (bug fix)
                elif any(s.get('top_speed', 0) == 0 for s in stats): needs_update = True
                
                # if needs_update: print(f"  [UPDATE] fixing {name}")

            if not needs_update: continue

            # FETCH INDIVIDUAL CAR PAGE (WIKITEXT)
            wiki_api_url = f"https://asphalt.fandom.com{link_path}?action=raw"
            raw_txt = fetch_url(wiki_api_url)
            
            if raw_txt:
                # 1. Parse Infobox for Vmax/Accel
                # Try multiple patterns for vmax
                # |vmax=155 or |top_speed=155
                vmax_match = re.search(r'\|(vmax|top_speed)\s*=\s*([\d\.]+)', raw_txt, re.IGNORECASE)
                accel_match = re.search(r'\|(accel|acceleration)\s*=\s*([\d\.]+)', raw_txt, re.IGNORECASE)
                
                real_vmax = 300.0 # Default fallback
                if vmax_match:
                    try: real_vmax = float(vmax_match.group(2))
                    except: pass
                
                # Unit conversion logic: if < 250, likely MPH -> KMH
                if real_vmax < 250: real_vmax = real_vmax * 1.609 
                
                game_accel = 70.0
                # We typically ignore real accel 0-60 time for game stats, just use base 70 or parsed if valid game stat?
                # Wiki usually lists real 0-60 (e.g. 3.2s). Game uses ~80. 
                # Let's stuck to 70.0 as safe base if we don't interpolate.

                # 2. Parse EXACT Ranks from {{A9stars}}
                rank_map = {}
                stock_match = re.search(r"Stock rank:.*?'''([\d,]+)'''", raw_txt, re.IGNORECASE)
                if stock_match:
                    rank_map[1] = int(stock_match.group(1).replace(',', ''))
                    
                star_matches = re.finditer(r"{{A9stars\|(\d+)\|\d+}} rank:.*?'''([\d,]+)'''", raw_txt, re.IGNORECASE)
                for m in star_matches:
                    s_lvl = int(m.group(1))
                    r_val = int(m.group(2).replace(',', ''))
                    rank_map[s_lvl] = r_val

                # Max Star?
                max_star_match = re.search(r"{{A9stars\|\d+\|(\d+)}}", raw_txt)
                max_star = int(max_star_match.group(1)) if max_star_match else 6
                if max_star < 1: max_star = 1
                if cls == 'D' and max_star > 5: max_star = 5 # Heuristic

                stat_list = []
                for s in range(1, max_star + 1):
                    # Resolve Rank
                    cur_rank = rank_map.get(s, 0)
                    if cur_rank == 0:
                        # Fallback to previous or stock
                        prev = stat_list[-1]['rank'] if stat_list else 1000
                        cur_rank = prev
                    
                    entry_type = "stock" if s == 1 else "gold" if s == max_star else "full"
                    
                    stat_list.append({
                        "star": s,
                        "type": entry_type,
                        "rank": cur_rank,
                        "top_speed": round(real_vmax, 1), # Always use parsed vmax
                        "accel": round(game_accel, 2),
                        "handling": 50.0,
                        "nitro": 50.0
                    })
                
                target_car['max_star'] = max_star
                target_car['stat'] = stat_list
                
                if is_new:
                    cars.append(target_car)
                    new_cars.append(target_car)
            else:
                 print("    [Warn] Failed to fetch details.")
            
    if new_cars or True: 
        cars.sort(key=lambda x: int(x.get('id', 0)))
        with open(CARS_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(cars, f, indent=2, ensure_ascii=False)
        print(f"\nSaved changes. {len(new_cars)} new cars added/updated.")

if __name__ == "__main__":
    main()
