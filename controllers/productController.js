const asyncHandler = require('express-async-handler')
const Product = require('../models/productModel')
const { fileSizeFormatter } = require('../utils/fileUpload')
const cloudinary = require('cloudinary').v2


//CREATE
const createProduct = asyncHandler (async (req, res) => {
    const {name, sku, category, quantity, price, description} = req.body

    //Validation
    if(!name || !category || !quantity || !price || !description){
        res.status(400)
        throw new Error('Please fill in all fields')
    }

    //Handle image upload
    let fileData = {}
    if(req.file){
    //Save image to Cloudinary
    let uploadedFile
    try {
        uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: 'Inventory App', resource_type: 'image'})
    } catch (error) {
        res.status(500)
        throw new Error('Image could not be uploaded')
    }

        fileData = {
            fileName: req.file.originalname,
            filePath: uploadedFile.secure_url,
            fileType: req.file.mimetype,
            fileSize: fileSizeFormatter(req.file.size, 2),
        }
    }

    //Create Product to the DB
    const product = await Product.create({
        user: req.user.id,
        name,
        sku,
        category,
        quantity,
        price,
        description,
        image: fileData
    })
    res.status(201).json(product)     
})


// READ - Get all Products
const getProducts = asyncHandler(async (req, res)=>{
    const products = await Product.find({user: req.user.id}).sort('-createdAt')
    res.status(200).json(products)
})

//READ-ONE Get Single Product
const getSingleProduct = asyncHandler(async (req, res)=>{
    const product = await Product.findById(req.params.id)

    //if product doesnt exist
    if(!product){
        res.status(404)
        throw new Error('Product not Found')
    }
    //match product to its user
    if(product.user.toString() !== req.user.id){ //toString is get from the Models
        res.status(401)
        throw new Error('User not Authorized')
    }
    res.status(200).json(product)
})

//UPDATE - Update Product
const updateProduct = asyncHandler(async (req, res)=>{
    const {name, category, quantity, price, description} = req.body
    const {id} = req.params

    const product = await Product.findById(id)

    //if product doesnt exist
    if(!product){
        res.status(404)
        throw new Error('Product not Found')
    }

    //match product to its user
    if(product.user.toString() !== req.user.id){ //toString is get from the Models
        res.status(401)
        throw new Error('User not Authorized')
    }

    //Handle image upload
    let fileData = {}
    if(req.file){

    //Save image to Cloudinary
    let uploadedFile
    try {
        uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: 'Inventory App', resource_type: 'image'})
    } catch (error) {
        res.status(500)
        throw new Error('Image could not be uploaded')
    }
        fileData = {
            fileName: req.file.originalname,
            filePath: uploadedFile.secure_url,
            fileType: req.file.mimetype,
            fileSize: fileSizeFormatter(req.file.size, 2),
        }
    }

    //Update Product
    const updatedProduct = await Product.findByIdAndUpdate(
        {_id: id},
        {
        name,
        category,
        quantity,
        price,
        description,
        image: Object.keys(fileData).length === 0 ? product?.image : fileData
        },
        {
            new: true,
            runValidators: true
        }
    )
    res.status(200).json(updatedProduct) 
})

//DELETE - Delete Product
const deleteProduct = asyncHandler(async (req, res)=>{
        const product = await Product.findById(req.params.id)

    //if product doesnt exist
    if(!product){
        res.status(404)
        throw new Error('Product not Found')
    }
    //match product to its user
    if(product.user.toString() !== req.user.id){ //toString is get from the Models
        res.status(401)
        throw new Error('User not Authorized')
    }
    await product.deleteOne()
    res.status(200).json({message: 'Product Deleted'})
})

module.exports = { 
    createProduct,
    getProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
}