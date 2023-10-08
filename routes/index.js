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

router.get('/sort-helper', async function (req, res, next) {
  const sortHelperData = await db.sortHelperDB();

  res.status(200).send(sortHelperData);
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
    const verifyEmp = await helpers.verifyPassword(Pwd, employee.Pwd);
    delete employee.Pwd;
    verifyEmp
      ? res.status(200).send(employee)
      : res.status(400).send('Invalid Password');
  } else {
    res.status(400).send('EmployeeID Not Found');
  }
});

router.post('/update-employee-profile', async function (req, res, next) {
  const employeeDetails = req.body;
  if (employeeDetails?.Pwd !== undefined) {
    employeeDetails.Pwd = await helpers.hashPassword(employeeDetails.Pwd);
  }
  let employee = await db.updateEmployeeDetails(employeeDetails);
  console.log('final', employee);
  res.status(200).send(employee);
});

router.post('/list-project', async function (req, res, next) {
  const projectDetails = req.body;

  let response = await db.listProject(projectDetails);
  await db.incrementProjectCount(projectDetails);
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

router.get('/apply-to-project', async function (req, res, next) {
  const employeeID = req.query.employeeID;
  const projectID = req.query.projectID;
  const response = await db.applyToProject(employeeID, projectID);
  res.status(200).send(response);
});

module.exports = router;
