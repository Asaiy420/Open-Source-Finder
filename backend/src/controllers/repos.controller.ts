import { Request, Response } from "express";
import axios from "axios";

export const getRepos = async (req: Request, res: Response):Promise<void> => {
    const {topic, stars, language, per_page=10, page = 1} = req.query;

    try {
        if (!language || !topic || !stars){
            res.status(400).json({
                error: "At least one filter (topic, stars, language) is required"
            })
            return;
        }
    
        let q = "";
        if (topic) q += `topic:${topic}`; 
        if (language) q += `language:${language}`; 
        if (stars) q += `stars:${stars}`; 
    
        q = q.slice(0, -1); // removes trailing '+'


        const response = await axios.get("https://api.github.com/search/repositories", {
            params: {
                q,
                sort: "stars", // sorts by stars popularity
                per_page,
                page
            }
        }); 

        res.status(200).json({
            total: response.data.total_count,
            repos: response.data.items,
            page,
            per_page
        })
    
    } catch (error) {
        
    }




}