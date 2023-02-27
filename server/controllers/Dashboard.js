var Messages = require("../utils/Dashboard/message");
var Dashboard = require('../utils/Dashboard');
var helpers = require('../services/helper')
const dashboardController = {
    getDashboardData: async (req, res) => { 
        let result = await Dashboard.getDashboardData();
        return helpers.showOutput(res, result, result.code);
    },
}
module.exports = {
    ...dashboardController
}
