// scripts/clean-links.mjs
import fs from 'fs';
import path from 'path';

const JOBS_PATH = path.resolve('./src/data/jobs.json');

async function cleanJobs() {
  console.log('Checking job posting links...');

  if (!fs.existsSync(JOBS_PATH)) {
    console.error(`Error: Could not find file at ${JOBS_PATH}`);
    return;
  }

  const rawData = fs.readFileSync(JOBS_PATH, 'utf-8');
  const data = JSON.parse(rawData);

  // Access the array inside the "jobs" key
  const jobsArray = data.jobs || [];

  const results = await Promise.all(
    jobsArray.map(async (job) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const response = await fetch(job.url, { 
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AstroCleaner/1.0'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return job;
        } else {
          console.log(`Removing (${response.status}): ${job.title} at ${job.company}`);
          return null;
        }
      } catch (error) {
        console.log(`Removing (Unreachable): ${job.title} - ${job.url}`);
        return null;
      }
    })
  );

  const activeJobs = results.filter(job => job !== null);

  // Re-wrap in the "jobs" object format
  const updatedData = {
    jobs: activeJobs
  };

  fs.writeFileSync(JOBS_PATH, JSON.stringify(updatedData, null, 2));

  console.log(`\nDone! Kept ${activeJobs.length} jobs. Removed ${jobsArray.length - activeJobs.length} dead links.`);
}

cleanJobs();