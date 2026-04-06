import os
import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# Updated path to match your request
INPUT_FILE = 'src/content/raw_job_postings.txt'
OUTPUT_DIR = 'src/content/jobs/'

def slugify(text):
    # Remove special characters and replace spaces with dashes
    slug = re.sub(r'\W+', '-', text.lower()).strip('-')
    return slug

def scrape_linkedin(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code != 200:
            print(f"Failed to fetch {url}: Status {resp.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

    soup = BeautifulSoup(resp.text, 'html.parser')
    
    # Extract Meta Tags (LinkedIn uses OpenGraph for the preview text)
    title_tag = soup.find("meta", property="og:title")
    desc_tag = soup.find("meta", property="og:description")
    
    full_title = title_tag["content"] if title_tag else "New Job Posting"
    desc_text = desc_tag["content"] if desc_tag else ""
    
    # Logic to clean up "Role at Company | LinkedIn"
    title = full_title.split(" | ")[0].split(" at ")[0].strip()
    
    company = "Unknown Company"
    if " at " in full_title:
        company = full_title.split(" at ")[1].split(" | ")[0].strip()

    # Metadata Extraction via Regex (similar to your Go logic)
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
    if not os.path.exists(INPUT_FILE):
        print(f"Input file {INPUT_FILE} not found.")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    with open(INPUT_FILE, 'r') as f:
        links = [line.strip() for line in f if line.strip()]

    if not links:
        print("No new links to process.")
        return

    for link in links:
        print(f"Processing: {link}")
        data = scrape_linkedin(link)
        if not data: continue

        # Generate unique filename based on title
        safe_title = slugify(data['title'])
        filename = f"{OUTPUT_DIR}{safe_title}.md"
        
        # Check if file already exists to avoid overwriting manually edited jobs
        if os.path.exists(filename):
            print(f"File {filename} already exists. Skipping.")
            continue

        # Write Astro Markdown Frontmatter
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
        with open(filename, 'w') as f:
            f.write(content)
        print(f"Successfully generated: {filename}")

if __name__ == "__main__":
    main()