const express = require('express')
const router = express.Router()
const {registerUser, loginUser, logout, getUser, updateUser, changePassword, forgotPassword, loggedInStatus, resetPassword} = require('../controllers/userController')
const protect = require('../middleware/authMiddleware')

router.get('/getuser', protect, getUser)
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/logout', logout)
router.get('/loggedin', loggedInStatus)
router.patch('/updateuser', protect, updateUser)
router.patch('/changepassword', protect, changePassword)
router.post('/forgotpassword', forgotPassword)
router.put('/resetpassword/:resetToken', resetPassword)


module.exports = router