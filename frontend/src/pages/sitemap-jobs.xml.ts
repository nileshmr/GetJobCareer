const API_URL =
  import.meta.env.PUBLIC_API_URL ||
  "https://get-job-career.vercel.app/api";

export async function GET() {
  const urls: string[] = [];

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
          urls.push(`
            <url>
              <loc>https://getjobcareer.com/jobs/${encodeURIComponent(
                job.slug
              )}</loc>
            </url>
          `);
        }
      }

      totalPages = data.pagination?.totalPages || 1;
      page++;
    } while (page <= totalPages);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
  ${urls.join("")}
</urlset>`;

    return new Response(xml.trim(), {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to generate job sitemap:", error);

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 500,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
