import dbConnect from "./dbConnect";
import RateLimit from "@/models/RateLimit";

export async function  ratelimit  ( { key , limit = 5 , window_in_seconds = 600}){
    await dbConnect() ;
    const expireAt = new Date(Date.now() + window_in_seconds * 1000) ;
    const record = await RateLimit.findOneAndUpdate(
        {key},
        {
            $inc: { count: 1 }, $setOnInsert: { expireAt }
        },
        {upsert: true, new: true },
    );
    return record.count <=limit ;
}