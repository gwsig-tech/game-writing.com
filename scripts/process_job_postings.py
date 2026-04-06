import os
import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime

# Get the absolute path of the repository root (one level up from /scripts)
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_FILE = os.path.join(REPO_ROOT, 'src', 'content', 'raw_job_postings.txt')
OUTPUT_DIR = os.path.join(REPO_ROOT, 'src', 'content', 'jobs')

def slugify(text):
    """Create a URL-friendly slug from a string."""
    slug = re.sub(r'\W+', '-', text.lower()).strip('-')
    return slug

def scrape_linkedin(url):
    """Fetches LinkedIn metadata using a Googlebot User-Agent."""
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept-Language": "en-US,en;q=0.9"
    }
    try:
        print(f"--- Attempting to scrape: {url} ---")
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            print(f"Error: Received HTTP {resp.status_code}")
            return None
    except Exception as e:
        print(f"Exception during request: {e}")
        return None

    soup = BeautifulSoup(resp.text, 'html.parser')
    
    # Extract OpenGraph Meta Tags
    title_tag = soup.find("meta", property="og:title")
    desc_tag = soup.find("meta", property="og:description")
    
    full_title = title_tag["content"] if title_tag else "New Job Posting"
    desc_text = desc_tag["content"] if desc_tag else ""
    
    # Logic to clean up LinkedIn titles (e.g., "Role at Company | LinkedIn")
    title = full_title.split(" | ")[0].split(" at ")[0].strip()
    
    company = "Unknown Company"
    if " at " in full_title:
        # Pulls 'Company' out of 'Role at Company'
        company = full_title.split(" at ")[1].split(" | ")[0].strip()

    # Metadata Mining via Regex
    years_match = re.search(r'(\d+\+?\s*years?)', desc_text, re.IGNORECASE)
    years = years_match.group(1) if years_match else "N/A"
    
    # Work Mode detection
    mode = "On-site"
    lower_desc = desc_text.lower()
    if "hybrid" in lower_desc: mode = "Hybrid"
    elif "remote" in lower_desc: mode = "Remote"

    return {
        "title": title,
        "company": company,
        "description": desc_text[:160] + "..." if desc_text else "No description available.",
        "full_body": desc_text if desc_text else "Click the apply link to view the full description on LinkedIn.",
        "link": url,
        "experience": years,
        "workType": "Full-Time",
        "location": "See Link",
        "mode": mode
    }

def main():
    print(f"Looking for input file at: {INPUT_FILE}")
    
    if not os.path.exists(INPUT_FILE):
        print(f"CRITICAL ERROR: {INPUT_FILE} does not exist.")
        return

    # Ensure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        print(f"Creating output directory: {OUTPUT_DIR}")
        os.makedirs(OUTPUT_DIR)

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        # Filter out empty lines and whitespace
        links = [line.strip() for line in f if line.strip()]

    if not links:
        print("Status: No new links found in raw_job_postings.txt. Exiting.")
        return

    print(f"Status: Found {len(links)} links to process.")

    processed_count = 0
    for link in links:
        # Basic URL validation
        if not link.startswith('http'):
            print(f"Skipping invalid URL: {link}")
            continue

        data = scrape_linkedin(link)
        if not data:
            print(f"Failed to extract data for: {link}")
            continue

        # Create a unique filename
        safe_title = slugify(data['title'])
        # Add a snippet of the company name to avoid title collisions
        safe_company = slugify(data['company'])
        filename = os.path.join(OUTPUT_DIR, f"{safe_title}-{safe_company}.md")
        
        # Avoid overwriting existing jobs
        if os.path.exists(filename):
            print(f"File already exists: {filename}. Skipping to avoid overwrite.")
            continue

        # Format the Astro Markdown Frontmatter
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
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Successfully generated: {filename}")
            processed_count += 1
        except Exception as e:
            print(f"Failed to write file {filename}: {e}")

    print(f"Done! Processed {processed_count} new job postings.")

if __name__ == "__main__":
    main()