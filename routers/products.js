const express = require('express');
const { categoryModel } = require('../models/category');
const router = express.Router();
const { productModel } = require('../models/product');//this model return an object thats why we have to add {}
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];//here we check the type of the image
        let uploadError = new Error('Invalid image type');
        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({ storage: storage })

router.get(`/`, async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') };
    }
    const ProductList = await productModel.find(filter).populate('category');
    //const ProductList = await productModel.find().select("image name -_id"); here i can select only image and name and delete _id from the "print"
    if (!ProductList) {
        res.status(500).json({ success: false })
    }
    res.send(ProductList);
});


router.get('/:ProductId', async (req, res) => {
    const product = await productModel.findById(req.params.ProductId).populate("category");
    if (!product)
        return res.status(500).json({ success: false, message: "The product with the given ID was not found!" })
    res.status(200).send(product)
});


router.get('/get/count', async (req, res) => {
    const productCount = await productModel.countDocuments((count) => count).clone();
    if (!productCount)
        return res.status(500).json({ success: false })
    res.status(200).send({ productCount: productCount })
});


router.get('/get/featured/:count', async (req, res) => {
    //to return only the featured products
    const countFeatured = req.params.count ? req.params.count : 0;//if there is not count number, it will be 0, else it will be the number of featured product we want to return
    //we use limit function to precise the X firsts featured products we want to return and we add "+" to convert count in number
    const productFeatured = await productModel.find({ isFeatured: true }).limit(+countFeatured);
    if (!productFeatured)
        return res.status(500).json({ success: false })
    res.status(200).send({ productFeatured })
});

//here we also takae care of the case we want to updateee the image of the product
router.put('/:ProductId',uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.ProductId))
        return res.status(400).send('Invalid Product ID')
    const category = await categoryModel.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const product=await productModel.findById(req.body.ProductId);
    if(!product) return res.status(400).send('Invalid Product');

    const file=req.file;
    let imagePath;

    if(file){
        const fileName=file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath=`${basePath}${fileName}`;
    }else{
        imagePath=product.image;
    }

    const updatedProduct = await productModel.findByIdAndUpdate(
        req.params.ProductId,
        {
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color
        },
        { new: true })
    if (!updatedProduct)
        return res.status(500).send("the product cannot be updated")
    res.send(updatedProduct);
})

router.put(
    '/gallery-images/:ImageId',
    uploadOptions.array('images', 10),
    async (req, res) => {
            if (!mongoose.isValidObjectId(req.params.ImageId)) {
                return res.status(400).send('Invalid Product Id')
            }
            const files = req.files;
            let imagePaths = [];
            const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
            if (files) {//here we check if we uploaded files 
                files.map(file => {
                    //console.log("file.fileName = ",file.fileName, " file.filename = ",file.filename)
                    imagePaths.push(`${basePath}${file.filename}`);
                })
            }
            console.log("imagePaths = ", imagePaths);

            const product = await productModel.findByIdAndUpdate(
                req.params.ImageId,
                {
                    images: imagePaths
                }, {
                new: true
            })
            if (!product) {
                return res.status(500).send('The product cannot be updated!');
            }
            res.send(product);
        })

//here we have single because we upload only one file
router.post('/', uploadOptions.single('image'), async (req, res) => {
    const category = await categoryModel.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const file = req.file;
    if (!file) return res.status(400).send('No image in the request');
    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let product = new productModel({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    })

    product = await product.save();

    if (!product)
        return res.status(500).send('The product cannot be created')

    res.send(product);
})



router.delete('/:ProductId', (req, res) => {
    productModel.findByIdAndRemove(req.params.ProductId).then(product => {
        if (product) {
            return res.status(200).json({ success: true, message: "The product is deleted!" });
        } else {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
    }).catch(err => {
        return res.status(400).json({ success: false, error: err })
    });
})



module.exports = router;