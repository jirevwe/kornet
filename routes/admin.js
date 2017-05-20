let express = require('express');
let router = express.Router();
let path = require('path');
let fs = require('fs');
let multer = require('multer');
let mkdirp = require('mkdirp');
let utils = require('../utils/api');
let Business = require('../models/business');
let BusinessCatalog = require('../models/business_catalog');
let Government = require('../models/govt');

let storage = multer.diskStorage({
    destination: './public/uploads/business',
    filename: function(req, file, cb) {
        cb( null, file.originalname);
    }
});

let upload = multer({
    limits: {
        fileSize: 10240000
    },
    storage : storage
});

var csrf = require('csurf');

let csrfProtection = csrf();
router.use(csrfProtection);

router.get('/govt/catalog', [utils.isAdminGovernment, utils.isActivated],  function (req, res, next) {
    let successMsg = req.flash('success')[0];
    res.render('admin/govt-catalog', {layout: 'auth_header', successMsg: successMsg, noMessage: !successMsg, user: req.user, csrfToken: req.csrfToken()});
});

router.get('/business', [utils.isAdminBusiness, utils.isActivated], (req, res, next) => {
    let user = req.user;
    let messages = req.flash('error');
    let successMsg = req.flash('success')[0];
    Business.findOne({'admin':user._id}).exec(function (err, business) {
        if(err){
            console.log(err);
            return res.redirect('/');
        }
        if(business){
            if(business.catalog == undefined)
            {
                let catalog = new BusinessCatalog({
                    name: business.name
                });
                catalog.save((err, cat) => {
                    business.catalog = cat._id;
                    business.save((error, new_busuiness) => {
                        console.log('saved catalog');
                    });
                });
            }else{
                BusinessCatalog.findById(business.catalog, (err, catalog) => {
                    if(catalog == undefined)
                    {
                        let catalog = new BusinessCatalog({
                            name: business.name
                        });
                        catalog.save((err, cat) => {
                            business.catalog = cat._id;
                            business.save((error, new_busuiness) => {
                                console.log('saved catalog');
                                result = new_busuiness;
                                res.redirect('/business/' + cat._id);
                                //res.send('/business/' + catalog._id);
                            });
                        });
                    }else
                        result = business;
                        res.redirect('/business/' + catalog._id);
                });
            }

        }

    });
});

router.get('/business/:catalog', [utils.isAdminBusiness, utils.isActivated], (req, res, next) => {
    Business.findById(req.params.catalog, (err, business) => {
        if(business.catalog == undefined)
        {
            let catalog = new BusinessCatalog({
                name: business.name
            });
            catalog.save((err, cat) => {
                business.catalog = cat._id;
                business.save((error, new_busuiness) => {
                    console.log('saved catalog');
                });
            });
        }else{
            BusinessCatalog.findById(business.catalog, (err, catalog) => {
                if(catalog == undefined)
                {
                    let catalog = new BusinessCatalog({
                        name: business.name
                    });
                    catalog.save((err, cat) => {
                        business.catalog = cat._id;
                        business.save((error, new_busuiness) => {
                            console.log('saved catalog');
                            res.redirect('/business/' + catalog._id);
                        });
                    });
                }else
                    res.redirect('/business/' + catalog._id);
            });
        }
    });
});

router.get('/get-network', (req, res, next) => {
    let user = req.session.controller;
    Controller.findOneAndUpdate({_id: user._id}, {$set :{ telco: 'MTN' }}, (err, controller) => {
        controller.save((err) => {
            res.redirect('/controller');
        })
    });
});

module.exports = router;