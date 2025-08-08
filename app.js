const express = require('express');
const app = express();
const methodOverride = require('method-override');

app.use(methodOverride('_method'));
const path = require('path');
app.use(express.urlencoded({ extended: true }));
const ejsMate = require('ejs-mate');
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

const ExpressError = require('./utils/ExpressError.js');

const listings=require('./routes/listing.js');
const reviews=require('./routes/review.js');

const mongoose = require('mongoose');
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
main().then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
})
async function main() {
    await mongoose.connect(MONGO_URL);
}
// Home route
app.get('/', (req, res) => {
    res.send('Hi, I am a simple server');
})




app.use('/listings', listings);
app.use('/listings/:id/reviews', reviews);

app.all('/*splat', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    let {statusCode=500,message="Something went Wrong"}=err;
    res.render('error.ejs', { statusCode, message });
    // res.status(statusCode).send(message);
});

app.listen(8080, () => {
    console.log('Server is running on port 8080');
})