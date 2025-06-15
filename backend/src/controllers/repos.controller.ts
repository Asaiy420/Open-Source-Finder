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
          per_page: Math.min(Number(per_page) || 10, 100), // Ensure valid range
          page: Math.max(Number(page) || 1, 1), // Ensure valid page number
        },
      }
    );

    res.status(200).json({
      total: response.data.total_count,
      repos: response.data.items,
      page: Number(page) || 1,
      per_page: Math.min(Number(per_page) || 10, 100),
    });
  } catch (error: any) {
    console.error("Error when getting repos:", error);
    
    // Handle different types of errors
    if (error.response) {
      // GitHub API returned an error
      console.error("GitHub API Error:", error.response.status, error.response.data);
      
      if (error.response.status === 401) {
        res.status(500).json({ error: "GitHub authentication failed" });
      } else if (error.response.status === 403) {
        res.status(500).json({ error: "GitHub API rate limit exceeded" });
      } else if (error.response.status === 422) {
        res.status(400).json({ error: "Invalid search query" });
      } else {
        res.status(500).json({ 
          error: "GitHub API error",
          details: error.response.data?.message || "Unknown error"
        });
      }
    } else if (error.request) {
      // Network error
      console.error("Network Error:", error.message);
      res.status(500).json({ error: "Network error - unable to reach GitHub API" });
    } else {
      // Other error
      console.error("Unexpected Error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }
};