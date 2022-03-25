const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//request validator functions
//makes sure routeId matches an order id
function orderExists(req, res, next){
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder){
        res.locals.order = foundOrder;
        next();
    } else {
      next({
        status: 404,
        message: `Order does not exist : ${orderId}`
      });
    };
}

function deliverToIsValid(req, res, next){
    const { data: { deliverTo } = {} } = req.body;
    if (deliverTo && deliverTo.length > 0){
        next();
    } else {
        next({
            status: 400,
            message: "Order must include a deliverTo."
        });
    };
}

function mobileNumberIsValid(req, res, next){
    const { data: { mobileNumber } = {} } = req.body;
    if (mobileNumber && mobileNumber.length > 0){
        next();
    } else {
        next({
            status: 400,
            message: "Order must include a mobileNumber."
        });
    };
}


function statusIsValid(req, res, next){
    const { data: { status } = {} } = req.body;
    const validStatuses = ["pending", "preparing", "out-for-delivery", "deliverd"];
    if (status && validStatuses.includes(status)){
        if (status == "delivered"){
            next({
                status: 400,
                message: "Delivered orders cannot be updated."
            });
        } else {
            next();
        };
    } else {
        next({
            status: 400,
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
        });
    };
}

//checks for an array of dishes
function dishesExist(req, res, next){
    const { data: { dishes } = {} } = req.body;
    if (dishes && Array.isArray(dishes) && dishes.length > 0){
        next();
    } else if (!dishes) {
        next({
            status: 400,
            message: "Order must include dishes."
        });
    } else {
        next({
            status: 400,
            message: "Order must include at least one dish."
        }); 
    };
}

//checks that each dish in the dishes array has a quantity
function dishesHaveQuantity(req, res, next){
    const { data: { dishes } = {} } = req.body;
    dishes.forEach((dish) => {
        const quant = dish.quantity;
        if (!quant || quant === 0 || typeof(quant) !== "number"){
            return next({
                status: 400,
                message: `Dish ${dishes.indexOf(dish)} must have a quantity that is an integer greater than 0.`
            }); 
        };
    });
    next();
}

//checks that order id of request matches the route id
function orderIdsMatch(req, res, next){
    const reqId = req.body.data.id;
    const routeId = req.params.orderId;
    if (reqId && reqId != routeId){
          next({
              status: 400,
              message: `Order id does not match route id. Dish: ${reqId}, Route: ${routeId}`
          });
      } else {
        next();
      };
  }

//checks that status is pending for the destroy function
function statusIsPending(req, res, next){
    if (res.locals.order.status == "pending"){
        next();
    } else {
        next({
            status: 400,
            message: "An order cannot be deleted unless it is pending."
        });
    };
}

//API handler functions
//list - lists all orders
function list(req, res){
    res.status(200).json({ data: orders });
}

//create - assigns unique id and adds dish
function create(req, res){
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

//read - returns info for order by order id
function read(req, res){
    res.json({data: res.locals.order});
}

//update - updates order
function update(req, res, next){
    const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const ogOrder = res.locals.order;
    res.json({ 
        data: {
            id: ogOrder.id,
            deliverTo: deliverTo,
            mobileNumber: mobileNumber,
            status: status,
            dishes: dishes 
        }
    });
}

//destroy - removes an order as long as it is in pending status
function destroy(req, res) {
    const foundOrder = res.locals.order;
    const index = orders.findIndex((order) => order.id === foundOrder.id);
    orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [deliverToIsValid, mobileNumberIsValid, dishesExist, dishesHaveQuantity, create],
    read: [orderExists, read], 
    update: [
        orderExists, 
        orderIdsMatch, 
        deliverToIsValid, 
        mobileNumberIsValid, 
        dishesExist, 
        dishesHaveQuantity, 
        statusIsValid,
        update
    ],
    delete: [ orderExists, statusIsPending, destroy],
}
