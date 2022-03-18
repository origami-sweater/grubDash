const path = require("path");


// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

//Request Validations
function nameIsValid(req, res, next){
    const { data: { name } = {} } = req.body;
    if (name && name.length > 0) {
        next();
    } else {
        next({
            status: 400,
            message: "Dish must include a name."
        });
    };
}

function descriptionIsValid(req, res, next){
    const { data: { description } = {} } = req.body;
    if (description && description.length > 0) {
        next();
    } else {
        next({
            status: 400,
            message:"Dish must include a description."
        });
    };
}

function priceIsValid(req, res, next){
    const { data: { price } = {} } = req.body;
    if (price > 0 && typeof(price) === "number"){
        next();
    } else if (!price){
        next({
            status: 400,
            message:"Dish must include a price."
        });
    } else {
        next({
            status: 400,
            message:"Dish must have a price that is an integer greater than 0."
        });
    };
}

function imgIsValid(req, res, next){
    const { data: { image_url } = {} } = req.body;
    if (image_url && image_url.length > 0) {
        next();
    } else {
        next({
            status: 400,
            message:"Dish must include an image_url."
        });
    };
}

function dishExists(req, res, next){ 
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish){
        res.locals.dish = foundDish;
        next();
    } else {
      next({
        status: 404,
        message: `Dish does not exist : ${dishId}`
      });
    };
}

//makes sure update reqs involving ids have a matching id to a route
function dishIdsMatch(req, res, next){
    const reqId = req.body.data.id;
    const routeId = req.params.dishId;
    if (reqId && reqId != routeId){
          next({
              status: 400,
              message: `Dish id does not match route id. Dish: ${reqId}, Route: ${routeId}`
          });
      } else {
        next();
      };
  }

//API functions
//list - lists all dishes
function list(req, res){
    res.json({ data: dishes });
}

//create - assigns unique id and adds dish
function create(req, res){
    const { data: { name, description, price, img } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        img
    }
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

//read - returns info for dish by dish id
function read(req, res){
    res.json({data: res.locals.dish});
}

//update - updates specified dish
function update(req, res, next){
    let { data: { id, name, description, price, image_url  } = {} } = req.body;
    const ogDish = res.locals.dish;
    if (name === ogDish.name && description === ogDish.description && price === ogDish.price && image_url === ogDish.img){
      next({
            status: 404,
            message: "Fields must be changed to perform update."
        });
    } else {
      req.body.data.id = ogDish.id;
      res.json({ data: req.body.data });
    };
}

module.exports = {
    list,
    create: [nameIsValid, descriptionIsValid, priceIsValid, imgIsValid, create],
    read: [dishExists, read],
    update: [dishExists, dishIdsMatch, nameIsValid, descriptionIsValid, priceIsValid, imgIsValid, update],
}
