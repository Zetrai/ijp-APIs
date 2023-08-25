const express = require('express');
const router = express.Router();

const db = require('../util/database');
const helpers = require('../util/helpers');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send(200, 'Success');
});

router.get('/get-all-employees', async function (req, res, next) {
  let employees = await db.getEmployees();
  employees = employees.recordset[0];
  console.log('All Employees: ', employees);
  res.status(200).send(employees);
});

router.get('/get-employee-by-id', async function (req, res, next) {
  const EmployeeID = req.query.EmployeeID;
  let employee = await db.getEmployeeByID(EmployeeID);
  console.log('Employee: ', employee);
  res.status(200).send(employee);
});

router.post('/register-employee', async function (req, res, next) {
  const EmployeeDetails = req.body;
  console.log(EmployeeDetails.Pwd);
  EmployeeDetails.Pwd = await helpers.hashPassword(EmployeeDetails.Pwd);
  console.log(EmployeeDetails);
  let employee = await db.createEmployee(EmployeeDetails);
  // employee = employee.recordset;
  console.log('Employee: ', employee);
  res.status(200).send('Registered');
});

router.post('/login-check', async function (req, res, next) {
  const EmployeeID = req.body.EmployeeID;
  const Pwd = req.body.Pwd;
  let employee = await db.getEmployeeByID(EmployeeID);
  console.log('Employee: ', employee);
  if (employee !== undefined) {
    console.log(Pwd, employee.Pwd);
    const verifyEmp = await helpers.verifyPassword(Pwd, employee.Pwd);
    delete employee.Pwd;
    verifyEmp
      ? res.status(200).send(employee)
      : res.status(400).send('Invalid Password');
  } else {
    res.status(400).send('EmployeeID Not Found');
  }
});

router.get('/get-list-data', async function (req, res, next) {
  let data = await db.getAllListData();
  console.log('List Data: ', data);
  res.status(200).send(data);
});

module.exports = router;
