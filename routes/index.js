const express = require('express');
const router = express.Router();

const db = require('../util/database');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send(200, 'Success');
});

router.get('/getAllEmployees', async function (req, res, next) {
  let employees = await db.getEmployees();
  employees = employees.recordset;
  console.log('All Employees: ', employees);
  res.status(200).send(employees);
});

router.get('/getEmployeeByID', async function (req, res, next) {
  const EmployeeID = req.query.EmployeeID;
  let employee = await db.getEmployeeByID(EmployeeID);
  employee = employee.recordset;
  console.log('Employee: ', employee);
  res.status(200).send(employee);
});

router.post('/createEmployee', async function (req, res, next) {
  const EmployeeDetails = req.body;
  let employee = await db.createEmployee(EmployeeDetails);
  // employee = employee.recordset;
  console.log('Employee: ', employee);
  res.status(200).send(employee);
});

module.exports = router;
