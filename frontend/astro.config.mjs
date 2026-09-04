// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

const API_URL =
  process.env.PUBLIC_API_URL ||
  "https://get-job-career.vercel.app/api";

async function getPublishedJobUrls() {
  const jobUrls = [];

  let page = 1;
  let totalPages = 1;

  try {
    do {
      const response = await fetch(
        `${API_URL}/jobs?page=${page}&limit=50`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch jobs: ${response.status}`
        );
      }

      const data = await response.json();

      const jobs = Array.isArray(data.jobs)
        ? data.jobs
        : [];

      for (const job of jobs) {
        if (job.slug && job.isPublished === true) {
          jobUrls.push(
            `https://getjobcareer.com/jobs/${encodeURIComponent(
              job.slug
            )}`
          );
        }
      }

      totalPages = data.pagination?.totalPages || 1;
      page++;
    } while (page <= totalPages);

    console.log(
      `[sitemap] Added ${jobUrls.length} published job URLs`
    );

    return jobUrls;
  } catch (error) {
    console.error(
      "[sitemap] Failed to fetch published jobs:",
      error
    );

    throw error;
  }
}

const jobUrls = await getPublishedJobUrls();

export default defineConfig({
  site: "https://getjobcareer.com",

  output: "server",

  adapter: cloudflare(),

  integrations: [
    sitemap({
      customPages: jobUrls,

      // Admin pages ko sitemap se exclude karega
      filter: (page) => !page.includes("/admin"),
    }),
  ],
});
