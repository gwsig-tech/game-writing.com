import os
import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# Path Setup
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_FILE = os.path.join(REPO_ROOT, 'src', 'content', 'raw_job_postings.txt')
OUTPUT_DIR = os.path.join(REPO_ROOT, 'src', 'content', 'jobs')

def slugify(text):
    # Limit to first 6 words to keep filenames sane
    short_text = " ".join(text.split()[:6])
    slug = re.sub(r'\W+', '-', short_text.lower()).strip('-')
    return slug

def scrape_linkedin(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept-Language": "en-US,en;q=0.9"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            return None
    except Exception:
        return None

    soup = BeautifulSoup(resp.text, 'html.parser')
    title_tag = soup.find("meta", property="og:title")
    desc_tag = soup.find("meta", property="og:description")
    
    full_title = title_tag["content"] if title_tag else "New Job Posting"
    desc_text = desc_tag["content"] if desc_tag else ""
    
    # Clean Title and Company
    title = full_title.split(" | ")[0].split(" at ")[0].strip()
    company = "Unknown Company"
    if " at " in full_title:
        company = full_title.split(" at ")[1].split(" | ")[0].strip()

    # Metadata Mining
    years_match = re.search(r'(\d+\+?\s*years?)', desc_text, re.IGNORECASE)
    years = years_match.group(1) if years_match else "N/A"
    
    mode = "On-site"
    if "hybrid" in desc_text.lower(): mode = "Hybrid"
    elif "remote" in desc_text.lower(): mode = "Remote"

    return {
        "title": title,
        "company": company,
        "description": desc_text[:160] + "...",
        "full_body": desc_text,
        "link": url,
        "experience": years,
        "workType": "Full-Time",
        "location": "See Link",
        "mode": mode
    }

def main():
    if not os.path.exists(INPUT_FILE): return
    if not os.path.exists(OUTPUT_DIR): os.makedirs(OUTPUT_DIR)

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        links = [line.strip() for line in f if line.strip()]

    if not links: return

    for link in links:
        if not link.startswith('http'): continue
        data = scrape_linkedin(link)
        if not data: continue

        # Unique filename: title-company.md
        filename = os.path.join(OUTPUT_DIR, f"{slugify(data['title'])}-{slugify(data['company'])}.md")
        
        if os.path.exists(filename): continue

        content = f"""---
title: "{data['title']}"
company: "{data['company']}"
location: "{data['location']} ({data['mode']})"
category: "Design"
workType: "{data['workType']}"
experience: "{data['experience']}"
datePosted: "{datetime.now().strftime('%B %d, %Y')}"
applyLink: "{data['link']}"
description: "{data['description']}"
---

## About the Role
{data['full_body']}

---
*Generated automatically from [LinkedIn]({data['link']})*
"""
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == "__main__":
    main()