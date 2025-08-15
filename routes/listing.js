const express = require('express');
const router = express.Router();

const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require('../utils/ExpressError.js');
const { listingSchema } = require('../schema.js');
const Listing = require('../models/listing.js');

const validateListing=(req,res,next)=>{
    let {error} = listingSchema.validateAsync(req.body);
    if(error){
        throw new ExpressError(400,error);
    }
    else next();
};

//index route
router.get('/', wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render('listings/index.ejs', { allListings });
}));

//new Listings
router.get('/new', (req, res) => {
    res.render('listings/new.ejs');
});


//show route
router.get('/:id', wrapAsync(async (req, res) => {
    let { id } = req.params;
    let currListing = await Listing.findById(id).populate('reviews');
    if(!currListing) {
        req.flash('success', 'Listing deleted succesfully!');
        res.redirect('/listings');
    };
    res.render('listings/show.ejs', { currListing });
}));

//create post route
router.post('/', validateListing,
    wrapAsync(async (req, res) => {
        
        let result = listingSchema.validateAsync(req.body);
        if(res.error){
            throw new ExpressError(400,result.error);
        }
        const newListing = await Listing(req.body.listing);
        newListing.save();
        req.flash('success', 'New Listing Created Successfully!');
        res.redirect(`/listings`);
    })
);

//edit route
router.get('/:id/edit', wrapAsync(async (req, res) => {
    let { id } = req.params;
    let currListing = await Listing.findById(id);
    if(!currListing) {
        req.flash('success', 'Listing deleted succesfully!');
        res.redirect('/listings');
    };
    res.render('listings/edit.ejs', { currListing });
}));

//update route
router.put('/:id',validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let updatedListing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });
    req.flash('success', 'Listing updated succesfully!');
    res.redirect(`/listings/${updatedListing._id}`);
}));

//delete route
router.delete('/:id', wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deleted = await Listing.findByIdAndDelete(id);
    console.log(deleted);
    req.flash('success', 'Listing deleted succesfully!');
    res.redirect('/listings');
}));

module.exports = router;