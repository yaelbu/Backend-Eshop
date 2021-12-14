const express = require('express');
const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

require('dotenv/config');

app.use(cors())
app.options('*', cors())

const api = process.env.API_URL;
const ConnectionString = process.env.CONNECTION_STRING;



//middleware
app.use(express.json())
app.use(morgan('tiny'))
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'))
//app.use(errorHandler()); add after answer

//Routes
const productsRouter = require('./routers/products');
const categoriesRouter = require('./routers/categories');
const ordersRouter = require('./routers/orders');
const usersRouter = require('./routers/users');

app.use(`${api}/products`, productsRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/orders`, ordersRouter);
app.use(`${api}/users`, usersRouter);

mongoose.connect(`${ConnectionString}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'E-shop-database'
}).then(() => {
    console.log("Db connection is ready..");
}).catch((err) => {
    console.log(err);
})

app.listen(3000, () => {
    console.log("Server is running http://localhost:3000")
})