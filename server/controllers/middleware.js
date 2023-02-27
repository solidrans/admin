const API_SECRET = process.env.API_SECRET;
var Users = require('../utils/Users')
var Admin = require('../utils/Admin')
let helpers = require('../services/helper')
const jwt = require('jsonwebtoken');

const middleware = {
      checkToken: async (req, res, next) => {
        let token = req.headers['access_token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
        if (!token) {
          return res.status(401).json({ status: false, message: "Something went wrong with token" });
        }
        if (token.startsWith('Bearer ')) {
          token = token.slice(7, token.length);
        }
        if (token) {
          jwt.verify(token, API_SECRET, async (err, decoded) => {
            if (err) {
              return res.status(401).json({ status: false, message: "Something went wrong with token" });
            }
            let user_id = decoded.user_id;
            let response = await Users.getUserDetail(user_id);
            if (!response.status) {
              return res.status(451).json({ status: false, message: "Your Account has been deleted by admin !!! Please register again" });
            }
            if (!response.data.status) {
              return res.status(423).json({ status: false, message: "Your account login has been disabled by admin !!! Please contact administrator" });
            }
            req.decoded = decoded;
            req.token = token
            next();
          });
        } else {
          return res.status(401).json({ status: false, message: "Something went wrong with token" });
        }
      },
      refreshToken: async (req, res) => {
        let requiredFields = ['type', '_id'];
        let validator = helpers.validateParams(req, requiredFields);
        if (!validator.status) {
          response = helpers.showResponse(false, validator.message)
          return res.status(203).json(response);
        }
        let { type, _id } = req.body
        if (type === 'user') {
          let result = await Users.getUserDetail(_id);
          if (!result.status) {
            return res.status(403).json(helpers.showResponse(false, "Invalid User"));
          }
          let userData = result.data;
          if (userData.status == 0) {
            return res.status(451).json(helpers.showResponse(false, "Your account login has been disabled by admin !!! Please contact administrator"));
          }
          if (userData.status == 2) {
            return res.status(423).json(helpers.showResponse(false, "Your Account has been deleted by admin !!! Please register again"));
          }
          let token = jwt.sign({ user_id: _id }, API_SECRET, {
            expiresIn: process.env.JWT_EXPIRY
          });
          data = { token: token, time: process.env.JWT_EXPIRY };
        }
        else if (type === 'admin') {
          let result = await getSingleData(Admin, { _id: ObjectId(_id) }, '');
          if (!result.status) {
            return res.status(403).json(helpers.showResponse(false, A_NOT_FOUND));
          }
          let AdminData = result.data;
          if (AdminData.status == 0) {
            return res.status(451).json(helpers.showResponse(false, A_DISABLED));
          }
          if (AdminData.status == 2) {
            return res.status(423).json(helpers.showResponse(false, A_DELETED));
          }
          let token = jwt.sign({ admin_id: _id }, API_SECRET, {
            expiresIn: process.env.JWT_EXPIRY
          });
          data = { token: token, time: process.env.JWT_EXPIRY };
        }
        return res.status(200).json(helpers.showResponse(true, "TOKEN_CREATED", data));
      },
      checkAdminToken: async (req, res, next) => {
        let token = req.headers['access_token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
        if (!token) {
          return res.status(401).json({ status: false, message: "Something went wrong with token" });
        }
        if (token.startsWith('Bearer ')) {
          token = token.slice(7, token.length);
        }
        if (token) {
          jwt.verify(token, API_SECRET, async (err, decoded) => {
            if (err) {
              return res.status(401).json({ status: false, message: "Something went wrong with token" });
            }
            let admin_id = decoded.admin_id;
            let response = await Admin.getAdminDetail(admin_id);
            if (!response.status) {
              return res.status(451).json({ status: false, message: "Your Account has been deleted by Super Admin !!! Please Contact Administrator" });
            }
            if (!response.data.status) {
              return res.status(423).json({ status: false, message: "Your account login has been disabled by Super Admin !!! Please contact Administrator" });
            }
            req.decoded = decoded;
            req.token = token
            next();
          });
        } else {
          return res.status(401).json({ status: false, message: "Something went wrong with token" });
        }
      },
}
module.exports = {...middleware }