const login = (req, res) => {
 const {email,password}=req.body;
 const user={email:"user@gmail.com",password:"user@123"}
 let profile=email===user.email&&password===user.password?"login successful":"login failed"
  res.status(200).send(profile);
};

const signUp = (req, res) => {
 const {email,password}=req.body;

  res.status(200).json({message:"login succesful",data:req.body});
};


const logOut = (req, res) => {
//clear the token 
  res.status(200).json({message:"logOut succesful"});
};

module.exports={login,signUp,logOut}
