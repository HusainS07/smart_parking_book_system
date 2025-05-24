"use server";
import Razorpay from "razorpay";
import BookingPage from "@/app/book/page";
import dbConnect from "@/lib/dbConnect";
import parkingslots from "@/models/parkingslots";
import payment from "@/models/payment";


export const initiate = async (amount ,useremail , slotid )=>{
    await dbConnect() ;
    var instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRET_KEY,
      });
      instance.orders.create({
        amount : 500
      })
}