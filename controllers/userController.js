const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Token = require('../models/tokenModel')
const crypto = require('crypto')
const sendEmail = require('../utils/sendEmail')

const generateToken = (id) => {
   return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '1d'})
}

//Get User Data
const getUser = asyncHandler(async (req, res)=>{
   const user = await User.findById(req.user._id)
   
   if(user){
      const {_id, name, email, photo, phone, bio} = user
      res.status(200).json({
          _id, name, email, photo, phone, bio
      })
   }else{
      res.status(400)
      throw new Error('User Not Found')
   }
   //res.send('get users')
})

//REGISTER
const registerUser = asyncHandler(async (req, res)=>{
    const {name, email, password} = req.body

 // Validation
 if(!name || !email || !password) {
    res.status(400)
    throw new Error('Please fill in all require fields')
 }
 if(password.length < 6){
    res.status(400)
    throw new Error('Password must be up to 6 characters')
 }

 //check if the user email allready exists
 const userExist = await User.findOne({email})

 if(userExist) {
    res.status(400)
    throw new Error('Email allready Exist')
 }

 //Create User
 const user = await User.create({
    name, email, password
 })

 //THE ENCRYPTION OF PASSWORD IS INSIDE OF /models/userModel.js

 //-----------------------------------------------------------
  //Generate Token
  const token = generateToken(user._id)

  //Send HTTP-only Cookie
  res.cookie('token', token, {
   path: '/',
   httpOnly: true,
   expires: new Date(Date.now() + 1000 * 86400), // 1 day
   sameSite: 'none',
   secure: true 
  })
 //-----------------------------------------------------------

 if(user){
    const {_id, name, email, photo, phone, bio} = user
    res.status(201).json({
        _id, name, email, photo, phone, bio, token
    })
 }else{
    res.status(400)
    throw new Error('Invalid User data')
 }
})

//LOGIN
const loginUser = asyncHandler(async (req, res) =>{
   const {email, password} = req.body

 //Validate Request
 if(!email || !password) {
   res.status(400)
   throw new Error('Please add email and password')
 }
 //Check if user exist
 const user = await User.findOne({email})

 if(!user) {
   res.status(400)
   throw new Error('User not Found, please signUp')
 }
 //User exist, check if password is correct
 const passwordIsCorrect = await bcrypt.compare(password, user.password)

 //Generate Token
 const token = generateToken(user._id)

 //Send HTTP-only Cookie
 if (passwordIsCorrect) {
   res.cookie('token', token,{
   path: '/',
   httpOnly: true,
   expires: new Date(Date.now() + 1000 * 86400), // 1 day
   sameSite: 'none',
   secure: true 
 })
 }

 if(user && passwordIsCorrect) {
   const {_id, name, email, photo, phone, bio} = user
   res.status(201).json({
       _id, name, email, photo, phone, bio, token
   })
 }else{
   res.status(400)
   throw new Error('Invalid email or password')
 }
})

//LOGGED IN STATUS
const loggedInStatus = asyncHandler(async (req, res)=>{
   const token = req.cookies.token
   if(!token){
      return res.json(false)
   }
   //Verify Token
   const verified = jwt.verify(token, process.env.JWT_SECRET)
   if(verified){
      return res.json(true)
   }
   return res.json(false)
})

//UPDATE USER
const updateUser = asyncHandler(async (req, res)=>{
   const user = await User.findById(req.user._id)

   if(user){
      const {name, email, photo, phone, bio} = user
      user.email = email,
      user.name = req.body.name || name
      user.phone = req.body.phone || phone
      user.bio = req.body.bio || bio
      user.photo = req.body.photo || photo

      const updatedUser = await user.save()
      res.status(200).json({
         _id: updatedUser._id, 
         name: updatedUser.name, 
         email: updatedUser.email, 
         photo: updatedUser.photo, 
         phone: updatedUser.phone, 
         bio: updatedUser.bio
      })
   }else{
      res.status(404)
      throw new Error('User not Found')
   }
})

//CHANGE PASSWORD
const changePassword = asyncHandler(async (req, res)=>{
   const user = await User.findById(req.user._id)
   const {oldPassword, password} = req.body

   if(!user){
      res.status(400)
      throw new Error('User not Found, Please Sing up')
   }

   //Validate
   if(!oldPassword || !password){
      res.status(400)
      throw new Error('Please add old and new Password')
   }
   // check if old password is matches password in DB
   const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)

   //Save new Password
   if(user && passwordIsCorrect){
      user.password = password
      await user.save()
      res.status(200).send('Password change successfuly')
   }else{
      res.status(400)
      throw new Error('Old Password is incorrect')
   }

})

//FORGOT PASSWORD
const forgotPassword = asyncHandler(async(req, res)=>{
   const {email} = req.body
   const user = await User.findOne({email})

   if (!user) {
      res.status(404)
      throw new Error('User does not exist')
   }

   // Delete token if it exist in DB (this function is for after you request reset password)
   let token = await Token.findOne({userId: user._id})
   if(token){
      await token.deleteOne()
   }

   // Create Reset Token
   let resetToken = crypto.randomBytes(32).toString('hex') + user._id
   console.log(resetToken)

   // Hashed Token before Saving to DB
   const hashedToken = crypto
   .createHash('sha256')
   .update(resetToken)
   .digest('hex')
   
   // Save Token to DB
   await new Token({
      userId: user._id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * (60 * 1000) // Thirty minutes
   }).save()

   // Construct Reset Url 
   const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

   // Reset Email
   const subject = "Password Reset Request"
   const send_to = user.email
   const sent_from = process.env.EAMIL_USER
   const message = `
      <h2>Hello ${user.name}</h2>
      <p>Please use the url below to reset your password</p>
      <p>This reset link is valid for only 30 minutes</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      <p>Regards</p>
   `
   try {
      await sendEmail(subject, message, send_to, sent_from)
      res.status(200).json({success: true, message:'Reset Email Sent'})
   } catch (error) {
      res.status(500)
      throw new Error('Email not Sent, please try again')
   }
})

//RESET PASSWORD
const resetPassword = asyncHandler(async (req, res)=>{
   const {password} = req.body
   const {resetToken} = req.params

   // Hash Token, then compare to Token in DB 
   const hashedToken = crypto
   .createHash('sha256')
   .update(resetToken)
   .digest('hex')

   //Find token in DB
   const userToken = await Token.findOne({
      token: hashedToken,
      expiresAt: {$gt: Date.now()}
   })
   if (!userToken){
      res.status(404);
      throw new Error('Invalid or Expires Token')
   }
   //Find User
   const user = await User.findOne({_id: userToken.userId})
   user.password = password
   await user.save()
   res.status(200).json({
      message: 'Password Reset Successful, Please Login'
   })
})


//LOGOUT
const logout = asyncHandler(async (req, res)=>{
   res.cookie('token', '', {
   path: '/',
   httpOnly: true,
   expires: new Date(0), // 1 day
   sameSite: 'none',
   secure: true 
 })
 return res.status(200).json({message: 'Succesfully Logged Out'})
})

module.exports = {
    getUser,
    registerUser,
    loginUser,
    updateUser,
    loggedInStatus,
    changePassword,
    forgotPassword,
    resetPassword,
    logout
}