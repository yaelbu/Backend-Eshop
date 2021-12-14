const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    color: {
        type: String,
    },
    icon: {
        type: String,
    },
});

//to create another field "id" with the same value as _id that is better for the fronted 
categorySchema.virtual('id').get(function(){
    return this._id.toHexString();
});

categorySchema.set('toJSON',{
    virtuals:true
});

exports.categoryModel = mongoose.model('categories', categorySchema);

