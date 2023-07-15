const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Please add a Name']
    },
    email: {
        type: String,
        required: [true, 'Please add a Email'],
        unique: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please enter a valid Email'
        ]
    },
    password:{
        type: String,
        required: [true, 'Please add a Password'],
        minLength: [6, 'Password must be up to 6 characters'],
        // maxLength: [23, 'Password must not be more than 23 characters'], // this is the Encryption password is inside of Model
    },
    photo: {
        type: String,
        required: [true, 'Please add a Photo'],
        default: 'https://i.ibb.co/4pDNDk1/avatar.png'
        //default: 'https://asset.cloudinary.com/dywrzmp2r/0f8c30735cee3b7b68105735ee74add6'
        //default: 'https://ibb.co/rcX2N4n'
    },
    phone:{
        type: String,
        default: '+63'
    },
    bio:{
        type: String,
        maxLength: [250, 'Bio must not be more than 250 characters'],
        default: 'No Bio yet'
    },
}, {timestamps: true})


// why the Encryption is inside the USER Mode? to evade the conflict of Maxlength of the Password
//Encrypt password and before it saves to database is will bycrypt first thats why called 'pre'
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')){ // to ignore the password editing
        return next()
    }

    //Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(this.password, salt)
    this.password = hashedPassword
    next()
})

const User = mongoose.model('User', userSchema)
module.exports = User