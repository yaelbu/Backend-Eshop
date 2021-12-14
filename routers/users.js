const express = require('express');
const router = express.Router();
const { userModel } = require('../models/user');//this model return an object thats why we have to add {}
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.get(`/`, async (req, res) => {
    const UserList = await userModel.find().select("-passwordHash");
    //const UserList = await userModel.find();
    if (!UserList) {
        res.status(500).json({ success: false })
    }
    res.send(UserList);
});


router.get('/:UserId', async (req, res) => {
    const user = await userModel.findById(req.params.UserId).select("-passwordHash");
    if (!user)
        return res.status(500).json({ success: false, message: "The user with the given ID was not found!" })
    res.status(200).send(user)
});


router.get('/get/count', async (req, res) => {
    const userCount = await userModel.countDocuments((count) => count).clone();
    if (!userCount)
        return res.status(500).json({ success: false })
    res.status(200).send({ userCount: userCount })
});



router.post('/', async (req, res) => {
    let newUser = new userModel({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        street: req.body.street,
        apartment: req.body.apartment,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
    });

    newUser = await newUser.save();
    if (!newUser)
        return res.status(400).send("The user cannot be created!");
    res.send(newUser);
});

router.put('/:UserId', async (req, res) => {
    const UserExist = await userModel.findById(req.params.UserId);
    let newPassword;
    if (req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10);
    } else {
        newPassword = UserExist.passwordHash;
    }

    const user = await userModel.findByIdAndUpdate(
        req.params.UserId,
        {
            name: req.body.name,
            email: req.body.email,
            passwordHash: newPassword,
            street: req.body.street,
            apartment: req.body.apartment,
            city: req.body.city,
            zip: req.body.zip,
            country: req.body.country,
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
        },
        { new: true })
    if (!user)
        return res.status(400).send("the user cannot be updated")
    res.send(user);
})

router.post('/login', async (req, res) => {
    const user = await userModel.findOne({ email: req.body.email })
    const secret = process.env.secret;
    if (!user) {
        return res.status(400).send('The user not found');
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
        )

        res.status(200).send({ user: user.email, token: token })
    } else {
        res.status(400).send('password is wrong!');
    }


})


router.post('/register', async (req, res) => {
    let user = new userModel({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })
    user = await user.save();

    if (!user)
        return res.status(400).send('the user cannot be created!')

    res.send(user);
})


module.exports = router;