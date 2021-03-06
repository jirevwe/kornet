// @ts-check
let express = require('express');
let http = require("http");
let router = express.Router();
let Controller = require('../models/controller');
let Business = require('../models/business');
let Government = require('../models/govt');
let User = require('../models/user');
let passport = require('passport');
const fs = require('fs');
let csrf = require('csurf');
let multer = require('multer');
let _ = require('underscore')._;
let randomstring = require("randomstring");
let loader = require('csv-load-sync');
let BusinessCatalog = require('../models/business_catalog');

let storage = multer.diskStorage({
	destination: './public/uploads/business',
	filename: function(req, file, cb) {
		cb( null, file.originalname);
	}
});

let govt_storage = multer.diskStorage({
    destination: './public/uploads/government',
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

let govt_upload = multer({
    limits: {
        fileSize: 10240000
    },
    storage : govt_storage
});

router.post('/add-to-business', upload.single('staff_file'), isLoggedIn, function (req, res, next) {
	let business_name = req.body.business_name;
	let created_by = req.session.controller;
	let staff_file = req.file.filename;
	let numbers = [];

	let csv = loader('./public/uploads/business/' + staff_file);
	//console.log(csv);
	_.map(csv, function (num, key) {
		numbers.push(_.toArray(num));
	});
	numbers = _.flatten(numbers);

	Business.findOne({'name':business_name}, function (err, business) {
		if (err) {
			req.flash('error', 'Error getting business.');
		}
		if (business) {
			console.log("business domain "+business.domain);

			let objects = [];
			let fixed_numbers = [];
			for (let i = 0; i < numbers.length; i++) {
				let number = numbers[i];
				if (number.match("^0")) {
					number = number.replace("0", "+234");
					fixed_numbers.push(number);
					//console.log(number);
				}
				if (number.match("^234")) {
					number = number.replace("234", "+234");
					fixed_numbers.push(number);
					//console.log(number);
				}
				objects.push({'name': number, 'email': 'none', 'phone_number': number, 'password': business.default_pass, 'network_provider':created_by.telco,
					'user_type': 'Business', 'user_domain': business.domain, 'security_token': 'none', 'long_text': 'none'})
			}

			User.find({'phone_number': {$in : fixed_numbers}}, function (err, users) {
				let users_id = [];
				if (err) {
					req.flash('error', 'Error getting user.');
					return res.redirect('/controller/add-batch/'+business._id);
				}
				if (users.length > 0){
					for (i = 0; i < fixed_numbers.length; i++) {
						req.flash('error', '"'+fixed_numbers[i] + '" has already been used.');
						//console.log(fixed_numbers[i] + ' has already been used.');
					}
					return res.redirect('/controller/add-batch/'+business._id);
				}
				else {
					User.insertMany(objects, function (err, result) {
						if (err) {
							console.log(err);
							req.flash('error', 'Error creating users.');
							return res.redirect('/controller/add-batch/'+business._id);
						} else {
							for (i = 0; i < result.length; i++) {
								users_id.push(result[i]._id)
							}
							console.log(users_id);
							let staff_number = parseInt(business.staff_number, 10) + parseInt(users_id.length, 10);
							Business.update({_id: business._id}, {$addToSet: {users: {$each: users_id}}, staff_number:staff_number}, function (err, result) {
								if (err) {
									req.flash('error', 'Error creating users.');
									return res.redirect('/controller/add-batch/' + business._id);
								}
								else {
									req.flash('success', 'Numbers have been added to ' + business_name);
									return res.redirect('/controller/add-batch/' + business._id);
								}
							});

						}
					});
				}

			});
		}
		if(!business){
			req.flash('error', 'Error creating business.');
			return res.redirect('/controller/add-batch/'+business._id);
		}

	});


});

router.post('/add-to-government', govt_upload.single('staff_file'), isLoggedIn, function (req, res, next) {
    let government_name = req.body.government_name;
    let domain_name = req.body.domain_name;
    let government_type = req.body.government_type;
    let staff_file = req.file.filename;
    let government_tier = req.body.government_tier;
    let created_by = req.session.controller;
    let numbers = [];

    let csv = loader('./public/uploads/government/' + staff_file);
    //console.log(csv);
    _.map(csv, function (num, key) {
        numbers.push(_.toArray(num));
    });
    numbers = _.flatten(numbers);

    Government.findOne({'name':government_name}, function (err, government) {
        if (err) {
            req.flash('error', 'Error getting government.');
        }
        if (government) {
            console.log("Government domain "+government.domain);

            let objects = [];
            let fixed_numbers = [];
            for (let i = 0; i < numbers.length; i++) {
                let number = numbers[i];
                if (number.match("^0")) {
                    number = number.replace("0", "+234");
                    fixed_numbers.push(number);
                    //console.log(number);
                }
                if (number.match("^234")) {
                    number = number.replace("234", "+234");
                    fixed_numbers.push(number);
                    //console.log(number);
                }
                objects.push({'name': number, 'email': 'none', 'phone_number': number, 'password': government.default_pass, 'network_provider':created_by.telco,
                    'user_type': 'Government', 'user_domain': government.domain, 'security_token': 'none', 'long_text': 'none'})
            }

            User.find({'phone_number': {$in : fixed_numbers}}, function (err, users) {
                let users_id = [];
                if (err) {
                    req.flash('error', 'Error getting user.');
                    return res.redirect('/controller/add-batch-government/'+government._id);
                }
                if (users.length > 0){
                    for (i = 0; i < fixed_numbers.length; i++) {
                        req.flash('error', '"'+fixed_numbers[i] + '" has already been used.');
                        //console.log(fixed_numbers[i] + ' has already been used.');
                    }
                    return res.redirect('/controller/add-batch-government/'+government._id);
                }
                else {
                    User.insertMany(objects, function (err, result) {
                        if (err) {
                            console.log(err);
                            req.flash('error', 'Error creating users.');
                            return res.redirect('/controller/add-batch-government/'+government._id);
                        } else {
                            for (i = 0; i < result.length; i++) {
                                users_id.push(result[i]._id)
                            }
                            console.log(users_id);
                            let staff_number = parseInt(government.staff_number, 10) + parseInt(users_id.length, 10);
                            Government.update({_id: government._id}, {$addToSet: {users: {$each: users_id}}, staff_number:staff_number}, function (err, result) {
                                if (err) {
                                    req.flash('error', 'Error creating users.');
                                    return res.redirect('/controller/add-batch-government/' + government._id);
                                }
                                else {
                                    req.flash('success', 'Numbers have been added to ' + government_name);
                                    return res.redirect('/controller/add-batch-government/' + government._id);
                                }
                            });

                        }
                    });
                }

            });
        }
        if(!government){
            req.flash('error', 'Error creating government users.');
            return res.redirect('/controller/add-batch-government/'+government._id);
        }

    });


});

router.post('/business', upload.single('staff_file'), isLoggedIn, function (req, res, next) {
	let business_name = req.body.business_name;
	let domain_name = req.body.domain_name;
	// let staff = req.body.staff;
	let staff_file = req.file.filename;
	// let network_provider = req.body.network_provider;
	let created_by = req.session.controller;

	console.log(created_by);

	let numbers = [];
	let token = randomstring.generate({
		length: 5,
		charset: 'numeric'
	});
	console.log("your password is "+token);


	let csv = loader('./public/uploads/business/' + staff_file);
	//console.log(csv);
	_.map(csv, function (num, key) {
		numbers.push(_.toArray(num));
	});
	numbers = _.flatten(numbers);

	let objects = [];
	let fixed_numbers = [];
	for (let i = 0; i < numbers.length; i++) {
		let number = numbers[i];
		if (number.match("^0")) {
			number = number.replace("0", "+234");
			fixed_numbers.push(number);
			//console.log(number);
		}
		if (number.match("^234")) {
			number = number.replace("234", "+234");
			fixed_numbers.push(number);
			//console.log(number);
		}
		objects.push({'name': number, 'email': 'none', 'phone_number': number, 'password': token, 'network_provider':created_by.telco,
			'user_type': 'Business', 'user_domain': domain_name, 'security_token': 'none', 'long_text': 'none'})
	}

	User.find({'phone_number': {$in : fixed_numbers}}, function (err, users) {
		let users_id = [];
		if (err) {
			req.flash('error', 'Error getting user.');
			return res.redirect('/controller/create-batch');
		}
		if (users.length > 0){
			for (let i = 0; i < fixed_numbers.length; i++) {
				req.flash('error', '"'+fixed_numbers[i] + '" has already been used.');
				//console.log(fixed_numbers[i] + ' has already been used.');
			}
			return res.redirect('/controller/create-batch');
		}
		else {
			User.insertMany(objects, function (err, result) {
				if(err){
					console.log(err);
					req.flash('error', 'Error creating users.');
					return res.redirect('/controller/create-batch');
				}else{
					for (i = 0; i < result.length; i++) {
						users_id.push(result[i]._id)
					}

					Business.findOne({ $or: [ {'name':business_name}, {'domain':domain_name} ] }, function (err, business) {
						if(err){
							req.flash('error', 'Error getting business.');
						}
						if(business){
							if(business.name == business_name){
								req.flash('error', '"'+business_name+'" Business name has been taken.');

							}
							if(business.domain == domain_name){
								req.flash('error', '"'+domain_name+'" Domain name has been taken.');

							}
						}else {

							let newBusiness = new Business;


							newBusiness.name = business_name;
							newBusiness.domain = domain_name;
							newBusiness.users = users_id;
							newBusiness.admin = users_id[0];
							newBusiness.staff_number = users_id.length;
							newBusiness.created_by = created_by.name;
							newBusiness.default_pass = token;

							//create user email account
							let mysql = require('mysql');
							let connection = mysql.createConnection({
								host     : 'www.kornet-test.com',
								user     : 'root2',
								password : '00000',
								database : 'vmail',
								debug    : false
							});

							connection.connect();
							let values = [domain_name, business_name, 'default_user_quota:1024;'];
							connection.query('INSERT INTO domain (domain, description, settings) VALUES (?,?,?)', values, function(err, results, fields) {
								if (err) console.log(err);
							});

							connection.end();
							//end create user email account

							let success = {
                                type: "Business",
								numbers: fixed_numbers,
								token: token,
								admin: fixed_numbers[0]
							};
							req.flash('success', success);

							newBusiness.save(function (err, result) {
								if (err) {
									req.flash('error', 'Error creating Business');
									console.log(err);
								}else{
									console.log("success");
								}
							});
						}
						return res.redirect('/controller/create-batch');
					});
				}
			});
		}
	});
});

router.post('/government', govt_upload.single('staff_file'), isLoggedIn, function (req, res, next) {
    let government_name = req.body.government_name;
    let domain_name = req.body.domain_name;
    let government_type = req.body.government_type;
    let staff_file = req.file.filename;
    let government_tier = req.body.government_tier;
    let created_by = req.session.controller;

    let numbers = [];
    let token = randomstring.generate({
        length: 5,
        charset: 'numeric'
    });
    console.log("your password is "+token);


    let csv = loader('./public/uploads/government/' + staff_file);
    //console.log(csv);
    _.map(csv, function (num, key) {
        numbers.push(_.toArray(num));
    });

    numbers = _.flatten(numbers);

    let objects = [];
    let fixed_numbers = [];
    for (i = 0; i < numbers.length; i++) {
        let number = numbers[i];
        if (number.match("^0")) {
            number = number.replace("0", "+234");
            fixed_numbers.push(number);
            //console.log(number);
        }
        if (number.match("^234")) {
            number = number.replace("234", "+234");
            fixed_numbers.push(number);
            //console.log(number);
        }
        objects.push({'name': number, 'email': 'none', 'phone_number': number, 'password': token, 'network_provider':created_by.telco,
            'user_type': 'Government', 'user_domain': domain_name, 'security_token': 'none', 'long_text': 'none'})
    }

    User.find({'phone_number': {$in : fixed_numbers}}, function (err, users) {
        let users_id = [];
        if (err) {
            req.flash('error', 'Error getting user.');
            return res.redirect('/controller/create-batch');
        }
        if (users.length > 0){
            for (i = 0; i < fixed_numbers.length; i++) {
                req.flash('error', '"'+fixed_numbers[i] + '" has already been used.');
                //console.log(fixed_numbers[i] + ' has already been used.');
            }
            return res.redirect('/controller/create-batch');
        }
        else {
            User.insertMany(objects, function (err, result) {
                if(err){
                    console.log(err);
                    req.flash('error', 'Error creating users.');
                    return res.redirect('/controller/create-batch');
                }else{
                    for (i = 0; i < result.length; i++) {
                        users_id.push(result[i]._id)
                    }

                    Government.findOne({ $or: [ {'name':government_name}, {'domain':domain_name} ] }, function (err, government) {
                        if(err){
                            req.flash('error', 'Error getting government.');
                        }
                        if(government){
                            if(government.name == government_name){
                                req.flash('error', '"'+government_name+'" Business name has been taken.');

                            }
                            if(government.domain == domain_name){
                                req.flash('error', '"'+domain_name+'" Domain name has been taken.');

                            }
                        }else {

                            let newGovernment = new Government;


                            newGovernment.name = government_name;
                            newGovernment.domain = domain_name;
                            newGovernment.users = users_id;
                            newGovernment.admin = users_id[0];
                            newGovernment.staff_number = users_id.length;
                            newGovernment.created_by = created_by.name;
                            newGovernment.default_pass = token;
                            newGovernment.type = government_type;
                            newGovernment.tier = government_tier;

                            //create user email account
                            let mysql = require('mysql');
                            let connection = mysql.createConnection({
                                host     : 'www.kornet-test.com',
                                user     : 'root2',
                                password : '00000',
                                database : 'vmail',
                                debug    : false
                            });

                            connection.connect();
                            let values = [domain_name, government_name, 'default_user_quota:1024;'];
                            connection.query('INSERT INTO domain (domain, description, settings) VALUES (?,?,?)', values, function(err, results, fields) {
                                if (err) console.log(err);
                            });

                            connection.end();
                            //end create user email account

                            let success = {
                                type: "Government",
                                numbers: fixed_numbers,
                                token: token,
                                admin: fixed_numbers[0]
                            };
                            req.flash('success', success);

                            newGovernment.save(function (err, result) {
                                if (err) {
                                    req.flash('error', 'Error creating Government');
                                    console.log(err);
                                }else{
                                    console.log("success");
                                }
                            });
                        }
                        return res.redirect('/controller/create-batch');
                    });
                }
            });
        }
    });
});

let csrfProtection = csrf();
router.use(csrfProtection);

router.get('/businesses', (req, res, next) => {
	let user = req.session.controller;
	let businesses = [];
	let messages = req.flash('error');
	let successMsg = req.flash('success')[0];
	Business.find({'created_by':user.name}).populate("admin").populate("users").exec(function (err, results) {
		if(err){
			console.log(err);
			return res.redirect('/controller/');
		}
		if(results){
			businesses = results;
		}
		return res.render('controller/business_listings', {layout: 'auth_header', businesses: businesses, user: req.session.controller, csrfToken: req.csrfToken(),  messages:messages, hasErrors:messages.length > 0, successMsg: successMsg, noMessage: !successMsg});
	});
});

router.get('/businesses/:catalog', (req, res, next) => {
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
							res.send('/business/' + catalog._id);
						});
					});
				}else
					res.send('/business/' + catalog._id);
			});
		}
	});
});

router.get('/get-network', isLoggedIn, (req, res, next) => {
	let user = req.session.controller;
	Controller.findOneAndUpdate({_id: user._id}, {$set :{ telco: 'MTN' }}, (err, controller) => {
		controller.save((err) => {
			res.redirect('/controller');
		})
	});
});

router.get('/', isLoggedIn, function (req, res, next) {
	let user = req.session.controller;
	let businesses = [];
    let governments = [];
	let messages = req.flash('error');
	let successMsg = req.flash('success')[0];
	Business.find({'created_by':user.name}).populate("admin").populate("users").exec(function (err, results) {
		if(err){
			console.log(err);
			return res.redirect('/controller/');
		}
		if(results){
			businesses = results;
		}
        Government.find({'created_by':user.name}).populate("admin").populate("users").exec(function (err, govts) {
            if (err) {
                console.log(err);
                return res.redirect('/controller/');
            }
            if (govts) {
                governments = govts;
            }
            return res.render('controller/index', {layout: 'auth_header', businesses: businesses, governments:governments, user: req.session.controller, csrfToken: req.csrfToken(),  messages:messages, hasErrors:messages.length > 0, successMsg: successMsg, noMessage: !successMsg});
        });
		//console.log(businesses);
	});
});

router.get('/logout', isLoggedIn, function (req, res, next) {
	req.session.controller = null;
// this also works
	delete req.session.controller;
	res.redirect('/controller/');
});

router.get('/users/:id', isLoggedIn, function (req, res, next) {
	let id = req.params.id;
	let businesses = [];
	Business.find({'_id':id}).populate("users", 'id, phone_number is_activated').exec(function (err, results) {
		if(err){
			console.log(err);
			return res.json({});
		}
		//console.log(results);
		if(results){
			businesses = results[0];

			return res.json(businesses.users);
		}
		return res.json({});
		//console.log(businesses);
	});

});

router.get('/government/:id', isLoggedIn, function (req, res, next) {
    let id = req.params.id;
    let governments = [];
    Government.find({'_id':id}).populate("users", 'id, phone_number is_activated').exec(function (err, results) {
        if(err){
            console.log(err);
            return res.json({});
        }
        //console.log(results);
        if(results){
            governments = results[0];

            return res.json(governments.users);
        }
        return res.json({});
        //console.log(businesses);
    });

});

router.get('/create-batch', isLoggedIn, function (req, res, next) {
	let messages = req.flash('error');
	let successMsg = req.flash('success')[0];
	res.render('controller/create_batch', {layout: 'auth_header', user: req.session.controller, csrfToken: req.csrfToken(),  messages:messages, hasErrors:messages.length > 0, successMsg: successMsg, noMessage: !successMsg});
});

router.get('/add-batch/:id', isLoggedIn, function (req, res, next) {
	let business_id = req.params.id;
	let messages = req.flash('error');
	let successMsg = req.flash('success')[0];

	Business.findOne({'_id':business_id}, function (err, business) {
		if (err) {
			req.flash('error', 'Error getting business.');
			return res.redirect('/controller/');
		}
		if (business){
			//console.log(business);
			return res.render('controller/add_batch', {layout: 'auth_header',business:business, user: req.session.controller, csrfToken: req.csrfToken(),  messages:messages, hasErrors:messages.length > 0, successMsg: successMsg, noMessage: !successMsg});
		}
		req.flash('error', 'Business not found');
		return res.redirect('/controller/');
	});
});

router.get('/add-batch-government/:id', isLoggedIn, function (req, res, next) {
    let government_id = req.params.id;
    let messages = req.flash('error');
    let successMsg = req.flash('success')[0];

    Government.findOne({'_id':government_id}, function (err, governmemt) {
        if (err) {
            req.flash('error', 'Error getting government.');
            return res.redirect('/controller/');
        }
        if (governmemt){
            //console.log(business);
            return res.render('controller/add_batch_government', {layout: 'auth_header', governmemt:governmemt, user: req.session.controller, csrfToken: req.csrfToken(),  messages:messages, hasErrors:messages.length > 0, successMsg: successMsg, noMessage: !successMsg});
        }
        req.flash('error', 'Government not found');
        return res.redirect('/controller/');
    });
});

router.get('/signin', notLoggedIn, function (req, res, next) {
	let messages = req.flash('error');
	res.render('controller/signin', {layout: 'auth_header', csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.post('/signin', notLoggedIn, function (req, res, next) {
	let email = req.body.email;
	let password = req.body.password;

	Controller.findOne({'email':email}, function (err, controller) {
		if(err){
			req.flash('error', 'Error getting user');
			return res.redirect('/controller/signin');
		}
		if(!controller){
			req.flash('error', 'User does not exist');
			return res.redirect('/controller/signin');
		}
		if(!controller.validatePassword(password)){
			req.flash('error', 'Wrong Password');
			return res.redirect('/controller/signin');
		}
		req.session.controller = controller;
		return res.redirect('/controller/');
	});
});

router.get('/telcos', isLoggedIn, function (req, res, next) {
	let user = req.session.controller;
	let telcos = [];
	let messages = req.flash('error');
	let successMsg = req.flash('success')[0];
	Controller.find({'telco':user.telco}, function (err, results) {
		if(err){
			console.log(err);
			return res.redirect('/controller/telco');
		}
		if(results){
			telcos = results;
		}
		//console.log(businesses);
		return res.render('controller/telcos', {layout: 'auth_header', telcos:telcos, user: req.session.controller, csrfToken: req.csrfToken(),  messages:messages, hasErrors:messages.length > 0, successMsg: successMsg, noMessage: !successMsg});
	});

});

router.get('/telcos/create', isLoggedIn, function (req, res, next) {
	let messages = req.flash('error');
	res.render('controller/create', {layout: 'auth_header', csrfToken: req.csrfToken(), messages:messages, hasErrors:messages.length > 0});
});

router.post('/reassign/:id', isLoggedIn, function (req, res, next) {
	let telco = req.session.controller;
	let reassign_id = req.params.id;
	let domain_name = req.body.domain_name;
	let password = req.body.password;
	let type = req.body.type;

	User.findOne({'_id':reassign_id}, function (err, user) {
		if(err){
			console.log(err);
			return res.json({result:'failed', message:'Error getting user'});
		}
		if(!user){
			return res.json({result:'failed', message:'User not found'});
		}
		user.name = user.phone_number;
		user.email = 'none';
		user.password = password;
		user.network_provider = telco.telco;
		user.user_type = type;
		user.security_token= 'none';
		user.long_text= 'none';
		user.user_domain = domain_name;


		user.security_answer = undefined;
		user.security_question = undefined;
		user.first_name = undefined;
		user.last_name = undefined;
		user.next_of_kin = undefined;
		user.next_of_kin_number = undefined;
		user.state = undefined;
		user.profile_image = undefined;
		user.contacts = [];
		user.gender = undefined;
		user.is_activated = undefined;
		user.wallet = undefined;

		user.save(function(err, result) {
			if (err) console.log(err);
			console.log(result);
		});
		return res.json({result:'success', message:'Number has been reassigned'});

	});

});

router.post('/telcos/create', isLoggedIn, function (req, res, next) {
	let email = req.body.email;
	let name = req.body.name;
	let password = req.body.password;
	let password2 = req.body.password2;
	let user = req.session.controller;

	if(password != password2){
		req.flash('error', 'Passwords do not match');
		return res.redirect('/controller/telcos/create');
	}
	Controller.findOne({'email':req.body.email}, function (err, controller) {
		if(err){
			req.flash('error', 'Error getting controller.');
			return res.redirect('/controller/telcos/create');
		}
		if(controller){
			if(controller.email == req.body.email){
				req.flash('error', 'Email Has been taken.');
				return res.redirect('/controller/telcos/create');
			}
		}

		let newController =  new Controller;

		newController.email = email;
		newController.name = name;
		newController.password = newController.encrypt(password);
		newController.created_by = user.name;
		newController.telco = user.telco;

		newController.save(function (err, result) {
			if(err){
				req.flash('error', 'Error creating user');
				console.log(err);
				return res.redirect('/controller/telcos/create');
			}
			req.flash('success', 'New  Telco user created');
			//req.session.controller= newController;
			//console.log(req.session.controller);
			return res.redirect('/controller/telcos');
		});
	});
});

module.exports = router;

function isLoggedIn(req, res, next){
	//console.log(res.locals.controller);
	if(req.session.controller)
		return next();
	req.session.oldUrl = req.url;
	res.redirect('/controller/signin');
}

function notLoggedIn(req, res, next){
	if(!req.session.controller)
		return next();
	res.redirect('/controller/');
}