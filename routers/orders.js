const express = require('express');
const router = express.Router();
const { orderModel } = require('../models/order');//this model return an object thats why we have to add {}
const { orderItemModel } = require('../models/orderItem');


router.get(`/`, async (req, res) => {
    //here, we get a list of order, in the list, we deploy user infromationa and we see only the name of the user. Moreover, we sort the dateOrdered in the decrease order
    const OrderList = await orderModel.find().populate('user','name').sort({'dateOrdered':-1});
    if (!OrderList) {
        res.status(500).json({ success: false })
    }
    res.send(OrderList);
});

router.get(`/:OrderId`, async (req, res) => {
   /*here, we get an order, in the details we deploy user infromationa 
    and we see only the name of the user. Moreover
    we sort the deploy orderItems details
    and in the details we deploy the product details and category details */
    const Order = await orderModel.findById(req.params.OrderId)
    .populate('user','name')
    .populate({
        path:'orderItems',populate:{//check if orderItems
            path:'product',populate:'category'
        }
    })
    if (!Order) {
        res.status(500).json({ success: false })
    }
    res.send(Order);
});

//here we count the total price of all the sales there is in db
router.get('get/totalsales',async(req,res)=>{
    const TotalSales=await orderModel.aggregate([
        {$group : { _id:null,totalsales:{$sum : '$totalPrice'}}}
    ])

    if(!TotalSales)
        return res.status(400).send('The total sales cannot be generated')
    res.send({totalSales:TotalSales.pop().totalSales})//here we add pop to display only totalSales result without the id
})

//here we count the number of orders there is in db
router.get('/get/count', async (req, res) => {
    const orderCount = await orderModel.countDocuments((count) => count).clone();
    if (!orderCount)
        return res.status(500).json({ success: false })
    res.status(200).send({ orderCount: orderCount })
});

router.get('get/userorders/:UserId', async (req, res) => {
    //here, we get a list of order, in the list according to UserId
    const OrderListUser = await orderModel.findById({user:req.body.UserId}).populate({
        path:'orderItems',populate:{//check if orderItems
            path:'product',populate:'category'}
        }).sort({'dateOrdered':-1});
    if (!OrderListUser) {
        res.status(500).json({ success: false })
    }
    res.send(OrderListUser);
});


router.post(`/`, async (req, res) => {
    const orderItemsIds=Promis.eall(req.body.orderItems.map(async orderItem=>{
        let newOrderItem=new orderItemModel({
            quantity:orderItem.quantity,
            product:orderItem.product
        })
        newOrderItem=await newOrderItem.save();
        return newOrderItem._id;
    }));
    const orderItemsIdResolved=await orderItemsIds;

    const totalPrices=await Promise.all(orderItemsIdResolved.map(async(orderItemId)=>{
        const orderItem=await orderItemModel.findById(orderItemId).populate('product','price');
        const totalPrice=orderItem.product.price*orderItem.quantity;
        return totalPrice;
    }));
    const totalPrice=totalPrices.reduce((a,b)=>a+b,0);
    



    const newOrder = new orderModel({
          orderItems:orderItemsIdResolved,
          shippingAddress1: req.body.shippingAddress1,
          shippingAddress2: req.body.shippingAddress2,
          city: req.body.city,
          zip: req.body.zip,
          country: req.body.country,
          phone: req.body.phone,
          status: req.body.status,
          totalPrice: totalPrice,
          user:req.body.user,
          dateOrdered: req.body.dateOrdered,
  
  
    });
    newOrder=await newOrder.save();
    if(!newOrder)
        return res.status(404).send("The order cannot be created!")
    res.send(newOrder);
});


router.put('/:OrderId',async(req,res)=>{
    const order=await orderModel.findByIdAndUpdate(
        req.params.OrderId,
        {
            status:req.body.status
    },
    {new:true})
    if(!order)
        return res.status(400).send("the order cannot be updated")
    res.send(order);
})


router.delete('/:OrderId',(req,res)=>{
    orderModel.findByIdAndRemove(req.params.OrderId).then(async order=>{
        if(order){
            await order.orderItems.map(async orderItem=>{
                await orderItemModel.findByIdAndRemove(order.orderItems);//check if orderItems is the good choice
            })
            return res.status(200).json({success:true,message:"The order is deleted!"});
            //ici on ajoute une boucle qui passe sur les orderItem Id
        }else{
            return res.status(404).json({success:false,message:"Order not found"});
        }
    }).catch(err=>{
        return res.status(400).json({success:false,error:err})
    });
})

module.exports = router;