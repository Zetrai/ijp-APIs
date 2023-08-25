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
    let result = await pool.request().query(`
        SELECT
            ED.EmployeeID,
            ED.Username,
            DL.Designation AS Designation,
            RL.EmpRole AS EmployeeRole,
            PL.Practice AS Practice,
            BL.Band AS Band,
            CL.Country AS Country,
            SL.StateName AS State,
            ED.TotalExperience,
            ED.Pwd
        FROM
            EmployeeDetails ED
            LEFT JOIN DesignationList DL ON ED.DesignationID = DL.DesignationID
            LEFT JOIN RoleList RL ON ED.EmpRoleID = RL.RoleID
            LEFT JOIN PracticeList PL ON ED.PracticeID = PL.PracticeID
            LEFT JOIN BandList BL ON ED.BandID = BL.BandID
            LEFT JOIN CountryList CL ON ED.CountryID = CL.CountryID
            LEFT JOIN StateList SL ON ED.StateID = SL.StateID
        WHERE
            ED.EmployeeID = '${EmployeeID}'
      `);

    return result.recordset[0]; // This contains the retrieved data
  } catch (error) {
    console.log(error);
  }
};

const createEmployee = async (Employee) => {
  try {
    let pool = await sql.connect(config);
    await pool.request().query(`INSERT INTO EmployeeDetails VALUES
    ('${Employee.EmployeeID}', 
    '${Employee.Username}',
    '${Employee.DesignationID}', 
    '${Employee.EmpRoleID}', 
    '${Employee.PracticeID}', 
    '${Employee.BandID}', 
    '${Employee.CountryID}', 
    '${Employee.StateID}', 
    '${Employee.TotalExperience}', 
    '${Employee.Pwd}')`);
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

const getAllListData = async () => {
  try {
    let pool = await sql.connect(config);

    const queries = [
      "SELECT SkillID AS ID, Skill AS Name, 'SkillList' AS TableName FROM SkillList",
      "SELECT DesignationID AS ID, Designation AS Name, 'DesignationList' AS TableName FROM DesignationList",
      "SELECT StateID AS ID, StateName AS Name, 'StateList' AS TableName FROM StateList",
      "SELECT CustomerID AS ID, Customer AS Name, 'CustomersList' AS TableName FROM CustomersList",
      "SELECT RoleID AS ID, EmpRole AS Name, 'RoleList' AS TableName FROM RoleList",
      "SELECT AccountID AS ID, Account AS Name, 'AccountList' AS TableName FROM AccountList",
      "SELECT BandID AS ID, Band AS Name, 'BandList' AS TableName FROM BandList",
      "SELECT PracticeID AS ID, Practice AS Name, 'PracticeList' AS TableName FROM PracticeList",
      "SELECT CountryID AS ID, Country AS Name, 'CountryList' AS TableName FROM CountryList",
    ];

    const results = {};

    for (const query of queries) {
      const result = await pool.request().query(query);
      const tableName = result.recordset[0].TableName;
      delete result.recordset[0].TableName;
      results[tableName] = result.recordset;
    }

    return results;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeByID,
  getAllListData,
};
