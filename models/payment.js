import mongoose from "mongoose";


const {Schema , model} = mongoose ;

const paymentschema = new Schema ({
    paymentid : {type : String  , required : true } ,
    useremail : {type : String , required : true } ,
    createdat : {type : Date , default : Date.now },
    amount : {type : Number  ,  required : true },
    completed : {type : Boolean  ,  required : true , default : false }

});

export default mongoose.models.payment || model("payment", paymentschema)  ;
