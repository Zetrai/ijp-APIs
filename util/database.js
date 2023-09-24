const config = require('./config').dbConfig;
const sql = require('mssql');

const getEmployees = async () => {
  try {
    let pool = await sql.connect(config);
    let employees = await pool.request().query(`
      SELECT
        ED.EmployeeID,
        ED.Username,
        DL.Designation AS Designation 
      FROM 
        EmployeeDetails ED
        LEFT JOIN DesignationList DL ON ED.DesignationID = DL.DesignationID`);
    return employees.recordset;
  } catch (error) {
    console.log(error);
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

    return result.rowsAffected[0] > 0 ? employeeData : false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const listProject = async (projectDetails) => {
  try {
    const {
      DisplayName,
      Customer,
      Account,
      Practice,
      Area,
      ProjectManagerID,
      DeliveryManagerID,
      CreatedByID,
      MandatorySkill,
      AdditionalSkills,
      ShortRoleDescription,
      DetailedRoleDescription,
    } = projectDetails;

    let pool = await sql.connect(config);
    const query = `
      INSERT INTO ProjectList (DisplayName, CustomerID, AccountID, PracticeID, Area, ProjectManagerID, 
        DeliveryManagerID, CreatedByID, MandatorySkillID, AdditionalSkills, ShortRoleDescription, DetailedRoleDescription)
      SELECT
        @DisplayName,
        (SELECT CustomerID FROM CustomersList WHERE Customer = @Customer) AS CustomerID,
        (SELECT AccountID FROM AccountList WHERE Account = @Account) AS AccountID,
        (SELECT PracticeID FROM PracticeList WHERE Practice = @Practice) AS PracticeID,
        @Area,
        @ProjectManagerID,
        @DeliveryManagerID,
        @CreatedByID,
        (SELECT SkillID FROM SkillList WHERE Skill = @MandatorySkill) AS MandatorySkillID,
        @AdditionalSkills,
        @ShortRoleDescription,
        @DetailedRoleDescription
    `;

    const result = await pool
      .request()
      .input('DisplayName', sql.VarChar(50), DisplayName)
      .input('Customer', sql.VarChar(50), Customer)
      .input('Account', sql.VarChar(50), Account)
      .input('Practice', sql.VarChar(50), Practice)
      .input('Area', sql.VarChar(50), Area)
      .input('ProjectManagerID', sql.Int, ProjectManagerID)
      .input('DeliveryManagerID', sql.Int, DeliveryManagerID)
      .input('CreatedByID', sql.Int, CreatedByID)
      .input('MandatorySkill', sql.VarChar(50), MandatorySkill)
      .input('AdditionalSkills', sql.VarChar(50), AdditionalSkills)
      .input('ShortRoleDescription', sql.VarChar(sql.MAX), ShortRoleDescription)
      .input(
        'DetailedRoleDescription',
        sql.VarChar(sql.MAX),
        DetailedRoleDescription
      )
      .query(query);

    return result.rowsAffected[0] > 0 ? projectDetails : false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const getListedProject = async () => {
  try {
    let pool = await sql.connect(config);
    let employees = await pool.request().query(`
      SELECT
        PL.ProjectID,
        PL.DisplayName,
        CL.Customer as Customer,
        AL.Account as Account,
        PCL.Practice as Practice,
        PL.Area,
        PL.ProjectManagerID,
        ED1.Username as ProjectMangerName,
        PL.DeliveryManagerID,
        ED2.Username as DeliveryManagerName,
        PL.CreatedByID,
        SL.Skill as MandatorySkill,
        PL.AdditionalSkills,
        PL.ShortRoleDescription,
        PL.DetailedRoleDescription
      FROM 
        ProjectList PL
        LEFT JOIN CustomersList CL ON PL.CustomerID = CL.CustomerID
        LEFT JOIN AccountList AL ON PL.AccountID = AL.AccountID
        LEFT JOIN PracticeList PCL ON PL.PracticeID = PCL.PracticeID
        LEFT JOIN EmployeeDetails ED1 ON PL.ProjectManagerID = ED1.EmployeeID
        LEFT JOIN EmployeeDetails ED2 ON PL.DeliveryManagerID = ED2.EmployeeID
        LEFT JOIN SkillList SL ON PL.MandatorySkillID = SL.SkillID
        `);
    return employees.recordset;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getEmployees,
  getAllListData,
  getEmployeeByID,
  registerEmployee,
  listProject,
  getListedProject,
};
