const config = require('./config').dbConfig;
const sql = require('mssql');

const getEmployees = async () => {
  try {
    let pool = await sql.connect(config);
    let employees = pool.request().query('SELECT * FROM EmployeeDetails');
    return employees;
  } catch (error) {
    console.log(error);
  }
};
const getEmployeeByID = async (EmployeeID) => {
  try {
    let pool = await sql.connect(config);
    let employees = pool
      .request()
      .query(
        `SELECT * FROM EmployeeDetails WHERE EmployeeID = '${EmployeeID}'`
      );
    return employees;
  } catch (error) {
    console.log(error);
  }
};
const createEmployee = async (Employee) => {
  try {
    let pool = await sql.connect(config);
    let employees = await pool.request()
      .query(`INSERT INTO EmployeeDetails VALUES
    ('${Employee.EmployeeID}', 
      '${Employee.Username}',
      '${Employee.Designation}', 
      '${Employee.TotalExperience}')`);
    return `Employee ${Employee.Username} Added`;
  } catch (error) {
    if (error.number === 2627) {
      console.log('Error: Duplicate entry for primary key.');
      return 'Duplicate Entry Error';
    } else {
      console.log(error);
    }
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeByID,
};
