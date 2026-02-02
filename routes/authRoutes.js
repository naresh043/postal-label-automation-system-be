const express=require("express");
const {login,signUp,logOut}=require("../controllers/authController")
const route=express.Router()
route.post("/login",login)
route.post("/signup",signUp)
route.post("/logout",logOut)


module.exports=route