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
  employees = employees;
  console.log('All Employees: ', employees);
  res.status(200).send(employees);
});

router.get('/get-employee-by-id', async function (req, res, next) {
  const EmployeeID = req.query.EmployeeID;
  let employee = await db.getEmployeeByID(EmployeeID);
  delete employee?.Pwd;
  console.log('Employee: ', employee);
  res.status(200).send(employee);
});

router.get('/get-list-data', async function (req, res, next) {
  let data = await db.getAllListData();
  // console.log('List Data: ', data);
  res.status(200).send(data);
});

router.post('/register-employee', async function (req, res, next) {
  const EmployeeDetails = req.body;
  EmployeeDetails.Pwd = await helpers.hashPassword(EmployeeDetails.Pwd);
  let employee = await db.registerEmployee(EmployeeDetails);
  delete employee.Pwd;
  // employee = employee.recordset;
  employee
    ? res.status(200).send(employee)
    : res.status(400).send('Registration Failed! Try again');
});

router.post('/login-check', async function (req, res, next) {
  const { EmployeeID, Pwd } = req.body;
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

router.post('/list-project', async function (req, res, next) {
  const projectDetails = req.body;

  let response = await db.listProject(projectDetails);
  response
    ? res.status(200).send('Project Listed')
    : res.status(400).send('Project Not Listed! Try again');
});

router.get('/get-listed-projects', async function (req, res, next) {
  const listedProjects = await db.getListedProject();

  if (listedProjects) {
    for (let i in listedProjects) {
      listedProjects[i].AdditionalSkills = listedProjects[
        i
      ].AdditionalSkills.replace(/'/g, '"');
    }
    res.status(200).send(listedProjects);
  } else {
    res.status(400).send('Error');
  }
});

module.exports = router;
