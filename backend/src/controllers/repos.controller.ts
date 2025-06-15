import { Request, Response } from "express";
import axios from "axios";
import "dotenv/config";

export const getRepos = async (req: Request, res: Response): Promise<void> => {
  const { topic, stars, language, per_page = 10, page = 1 } = req.query;

  try {
    // Check if at least one filter is provided
    if (
      ![topic, stars, language].some(
        (val) => typeof val === "string" && val.trim() !== ""
      )
    ) {
      res.status(400).json({
        error: "At least one filter (topic, stars, language) is required",
      });
      return;
    }

    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const perPageNum = Math.min(
      Math.max(parseInt(per_page as string) || 10, 1),
      100
    );

    let queryParts: string[] = [];

    if (topic && typeof topic === "string") {
      queryParts.push(`topic:${encodeURIComponent(topic.trim())}`);
    }
    if (language && typeof language === "string") {
      queryParts.push(`language:${encodeURIComponent(language.trim())}`);
    }
    if (stars && typeof stars === "string") {
      queryParts.push(`stars:${encodeURIComponent(stars.trim())}`);
    }

    const q = queryParts.join("+");

    // Add more detailed logging
    console.log("GitHub API Query:", q);
    console.log("GitHub Token present:", !!process.env.GITHUB_TOKEN);

    const response = await axios.get(
      "https://api.github.com/search/repositories",
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "User-Agent": "Github Open Source Finder ", // GitHub requires a User-Agent header
        },
        params: {
          q,
          sort: "stars",
          order: "desc", // Add explicit order
          per_page: perPageNum, // Ensure valid range
          page: pageNum, // Ensure valid page number
        },
      }
    );

    const totalResults = response.data.total_count;
    const totalPages = Math.ceil(totalResults / perPageNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: {
        repos: response.data.items,
        pagination: {
          currentPage: pageNum,
          per_page: perPageNum, 
          total_results: totalResults,
          total_pages: totalPages,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage,
          next_page: hasNextPage ? pageNum + 1 : null,
          prevPage: hasPrevPage ? pageNum - 1 : null,
        },
      },
    });
  } catch (error: any) {
    console.error("Error when getting repos:", error);

    // Handle different types of errors
    if (error.response) {
      // GitHub API returned an error
      console.error(
        "GitHub API Error:",
        error.response.status,
        error.response.data
      );

      if (error.response.status === 401) {
        res.status(500).json({ error: "GitHub authentication failed" });
      } else if (error.response.status === 403) {
        res.status(500).json({ error: "GitHub API rate limit exceeded" });
      } else if (error.response.status === 422) {
        res.status(400).json({ error: "Invalid search query" });
      } else {
        res.status(500).json({
          error: "GitHub API error",
          details: error.response.data?.message || "Unknown error",
        });
      }
    } else if (error.request) {
      // Network error
      console.error("Network Error:", error.message);
      res
        .status(500)
        .json({ error: "Network error - unable to reach GitHub API" });
    } else {
      // Other error
      console.error("Unexpected Error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }
};
