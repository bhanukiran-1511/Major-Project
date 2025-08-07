const express = require('express');
const app = express();
const Listing = require('./models/listing.js');
const Review = require('./models/review.js');
const methodOverride = require('method-override');
const { listingSchema ,reviewSchema} = require('./schema.js');

app.use(methodOverride('_method'));
const path = require('path');
app.use(express.urlencoded({ extended: true }));
const ejsMate = require('ejs-mate');
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

const wrapAsync = require('./utils/wrapAsync.js');
const ExpressError = require('./utils/ExpressError.js');

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

const validateListing=(req,res,next)=>{
    let {error} = listingSchema.validateAsync(req.body);
        if(error){
            throw new ExpressError(400,error);
        }
        else next();
}
const validateReview=(req,res,next)=>{
    let {error} = reviewSchema.validateAsync(req.body);
        if(error){
            throw new ExpressError(400,error);
        }
        else next();
}

//index route
app.get('/listings', wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render('listings/index.ejs', { allListings });
}));

//new Listings
app.get('/listings/new', (req, res) => {
    res.render('listings/new.ejs');
});


//show route
app.get('/listings/:id', wrapAsync(async (req, res) => {
    let { id } = req.params;
    let currListing = await Listing.findById(id).populate('reviews');
    res.render('listings/show.ejs', { currListing });
}));

//create post route
app.post('/listings', validateListing,
    wrapAsync(async (req, res) => {
        
        let result = listingSchema.validateAsync(req.body);
        if(res.error){
            throw new ExpressError(400,result.error);
        }
        const newListing = await Listing(req.body.listing);
        newListing.save();
        res.redirect(`/listings`);
    })
);

//edit route
app.get('/listings/:id/edit', wrapAsync(async (req, res) => {
    let { id } = req.params;
    let currListing = await Listing.findById(id);
    res.render('listings/edit.ejs', { currListing });
}));

//update route
app.put('/listings/:id',validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let updatedListing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });
    res.redirect(`/listings/${updatedListing._id}`);
}));

//delete route
app.delete('/listings/:id', wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deleted = await Listing.findByIdAndDelete(id);
    console.log(deleted);
    res.redirect('/listings');
}));

//Reviews routes
app.post('/listings/:id/reviews', validateReview,wrapAsync(async(req, res) => {
    let currListing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    currListing.reviews.push(newReview);
    await newReview.save();
    await currListing.save();
    res.redirect(`/listings/${currListing._id}`);
}));

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