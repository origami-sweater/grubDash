const router = require("express").Router();
const controller = require("./orders.controller");
//Error handling
const methodNotAllowed = require("../errors/methodNotAllowed");

router
    .route("/:orderId")
    .get(controller.read)
    .put(controller.update)
    .all(methodNotAllowed);

router
    .route("/") //orders
    .get(controller.list)
    .post(controller.create)
    .all(methodNotAllowed);

module.exports = router;
