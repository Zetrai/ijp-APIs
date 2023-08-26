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
            RL.EmpRoleID AS EmployeeRole,
            PL.Practice AS Practice,
            BL.Band AS Band,
            CL.Country AS Country,
            SL.StateName AS State,
            ED.TotalExperience,
            ED.Pwd
        FROM
            EmployeeDetails ED
            LEFT JOIN DesignationList DL ON ED.DesignationID = DL.DesignationID
            LEFT JOIN RoleList RL ON ED.EmpRoleID = RL.EmpRoleID
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

const registerEmployee = async (employeeData) => {
  try {
    const {
      EmployeeID,
      Username,
      Designation,
      EmpRole,
      Practice,
      Band,
      Country,
      State,
      TotalExperience,
      Pwd,
    } = employeeData;

    let pool = await sql.connect(config);
    const query = `
      INSERT INTO EmployeeDetails (EmployeeID, Username, DesignationID, EmpRoleID, PracticeID, BandID, CountryID, StateID, TotalExperience, Pwd)
      SELECT
        @EmployeeID,
        @Username,
        (SELECT DesignationID FROM DesignationList WHERE Designation = @Designation) AS DesignationID,
        (SELECT EmpRoleID FROM RoleList WHERE EmpRole = @EmpRole) AS EmpRoleID,
        (SELECT PracticeID FROM PracticeList WHERE Practice = @Practice) AS PracticeID,
        (SELECT BandID FROM BandList WHERE Band = @Band) AS BandID,
        (SELECT CountryID FROM CountryList WHERE Country = @Country) AS CountryID,
        (SELECT StateID FROM StateList WHERE StateName = @State) AS StateID,
        @TotalExperience,
        @Pwd
    `;

    const result = await pool
      .request()
      .input('EmployeeID', sql.Int, EmployeeID)
      .input('Username', sql.VarChar(50), Username)
      .input('Designation', sql.VarChar(50), Designation)
      .input('EmpRole', sql.VarChar(50), EmpRole)
      .input('Practice', sql.VarChar(50), Practice)
      .input('Band', sql.VarChar(50), Band)
      .input('Country', sql.VarChar(50), Country)
      .input('State', sql.VarChar(50), State)
      .input('TotalExperience', sql.Int, TotalExperience)
      .input('Pwd', sql.VarChar(sql.MAX), Pwd) // Use sql.VarChar(sql.MAX) for varchar(max)
      .query(query);

    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const getAllListData = async () => {
  try {
    let pool = await sql.connect(config);

    const queries = [
      'SELECT Skill AS Name FROM SkillList',
      'SELECT Designation AS Name FROM DesignationList',
      'SELECT StateName AS Name FROM StateList',
      'SELECT Customer AS Name FROM CustomersList',
      'SELECT EmpRole AS Name FROM RoleList',
      'SELECT Account AS Name FROM AccountList',
      'SELECT Band AS Name FROM BandList',
      'SELECT Practice AS Name FROM PracticeList',
      'SELECT Country AS Name FROM CountryList',
    ];

    const results = {};

    for (const query of queries) {
      const result = await pool.request().query(query);
      const tableName = query.split('FROM ')[1];
      results[tableName] = result.recordset.map((item) => item.Name);
    }

    return results;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  registerEmployee,
  getEmployees,
  getEmployeeByID,
  getAllListData,
};
