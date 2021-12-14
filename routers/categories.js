const express = require('express');
const { redirect } = require('express/lib/response');
const router = express.Router();
const { categoryModel } = require('../models/category');//this model return an object thats why we have to add {}


router.get(`/`, async (req, res) => {
    let CategoryList = await categoryModel.find();
    if (!CategoryList) {
        res.status(500).json({ success: false })
    }
    res.status(200).send(CategoryList);
});

router.get('/:CategoryId',async(req,res)=>{
    const category=await categoryModel.findById(req.params.CategoryId);
        if(!category)
            return res.status(500).json({success:false,message:"The category with the given ID was not found!"})
        res.status(200).send(category)
});

router.put('/:CategoryId',async(req,res)=>{
    const category=await categoryModel.findByIdAndUpdate(
        req.params.CategoryId,
        {
            name:req.body.name,
            icon:req.body.icon,
            color:req.body.color
    },
    {new:true})
    if(!category)
        return res.status(400).send("the category cannot be updated")
    res.send(category);
})

router.post(`/`, async (req, res) => {
    let newCategory = new categoryModel({
        name: req.body.name,
        color: req.body.color,
        icon: req.body.icon,
    });
    newCategory = await newCategory.save();
    if (!newCategory)
        return res.status(404).send("The category cannot be created!")
    res.send(newCategory);
});

router.delete('/:CategoryId',(req,res)=>{
    categoryModel.findByIdAndRemove(req.params.CategoryId).then(category=>{
        if(category){
            return res.status(200).json({success:true,message:"The category is deleted!"});
        }else{
            return res.status(404).json({success:false,message:"Category not found"});
        }
    }).catch(err=>{
        return res.status(400).json({success:false,error:err})
    });
})

module.exports = router;