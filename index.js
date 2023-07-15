const express = require('express')
const dotenv = require('dotenv').config()
const bodyParser = require('body-parser')
const cors = require('cors')
const colors = require('colors')
const connectDB = require('./config/db');
const userRoute = require('./routes/user.Routes')
const productRoute = require('./routes/product.Routes')
const contactRoute = require('./routes/contact.Routes')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const path = require('path')


const port = process.env.PORT || 5000;
connectDB();

const app = express();

//ErrorMidleware
app.use(errorHandler)

//middlewares
app.use(cookieParser())
app.use(cors({
    origin: ['http://localhost:3000', 'https://nventree.vercel.app'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))) //fileUpload.js


//Routes
app.use('/api/users', userRoute)
app.use('/api/products', productRoute)
app.use('/api/contactus', contactRoute)

//tester routes
app.get('/api', (req, res)=>{
    res.send('Hello Worlds')
    console.log('Load Balancer Tester')
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
});