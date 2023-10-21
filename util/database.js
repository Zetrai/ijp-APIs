const config = require('./config').dbConfig;
const sql = require('mssql');

const getEmployees = async () => {
  try {
    let pool = await sql.connect(config);
    let employees = await pool.request().query(`
      SELECT
        ED.EmployeeID,
        ED.Username,
        DL.Designation AS Designation,
        ED.ProjectsApplied
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

const sortHelperDB = async () => {
  try {
    let pool = await sql.connect(config);
    const queries = [
      'SELECT Skill, ProjectCount FROM SkillList ORDER BY ProjectCount DESC',
    ];
    // let res = await pool.request().query(`
    //   SELECT Skill, ProjectCount FROM SkillList ORDER BY ProjectCount DESC
    // `);

    const results = {};
    for (const query of queries) {
      const result = await pool.request().query(query);
      const tableName = query.match(/FROM\s+(\w+)/i)[1];
      results[tableName] = result.recordsets[0];
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
            ED.Pwd,
            ED.ProjectsApplied
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

const getEmployeeByIDs = async (ids) => {
  let whereClause = '';
  for (let id of ids) {
    whereClause += `ED.EmployeeID = '${id}' OR `;
  }
  whereClause = whereClause.replace(/ OR\s*$/, '');
  try {
    let pool = await sql.connect(config);
    const query = `
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
          ED.ProjectsApplied
      FROM
          EmployeeDetails ED
          LEFT JOIN DesignationList DL ON ED.DesignationID = DL.DesignationID
          LEFT JOIN RoleList RL ON ED.EmpRoleID = RL.EmpRoleID
          LEFT JOIN PracticeList PL ON ED.PracticeID = PL.PracticeID
          LEFT JOIN BandList BL ON ED.BandID = BL.BandID
          LEFT JOIN CountryList CL ON ED.CountryID = CL.CountryID
          LEFT JOIN StateList SL ON ED.StateID = SL.StateID
      WHERE
          ${whereClause}
    `;
    let result = await pool.request().query(query);
    return result.recordset; // This contains the retrieved data
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

const updateEmployeeDetails = async (employeeDetails) => {
  try {
    let pool = await sql.connect(config);
    let emp = await getEmployeeByID(employeeDetails.EmployeeID);
    emp['EmpRole'] = emp.EmployeeRole;
    for (let key in employeeDetails) {
      emp[key] = employeeDetails[key];
    }
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
    } = emp;

    let query = `UPDATE EmployeeDetails SET 
      Username = @Username, 
      DesignationID = (SELECT DesignationID FROM DesignationList WHERE Designation = @Designation),
      EmpRoleID = (SELECT EmpRoleID FROM RoleList WHERE EmpRole = @EmpRole),
      PracticeID = (SELECT PracticeID FROM PracticeList WHERE Practice = @Practice),
      BandID = (SELECT BandID FROM BandList WHERE Band = @Band),
      CountryID = (SELECT CountryID FROM CountryList WHERE Country = @Country),
      StateID = (SELECT StateID FROM StateList WHERE StateName = @State),
      TotalExperience = @TotalExperience,
      Pwd = @Pwd
    WHERE EmployeeID = @EmployeeID`;

    await pool
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
      .input('Pwd', sql.VarChar(sql.MAX), Pwd)
      .query(query);

    const updatedEmployee = await getEmployeeByID(emp.EmployeeID);
    const updatedEmployeeList = await getEmployees();

    delete updatedEmployee.Pwd;
    const response = {
      updatedEmployee: updatedEmployee,
      updatedEmployeeList: updatedEmployeeList,
    };
    return response;
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
      Country,
      State,
      ProjectManagerID,
      DeliveryManagerID,
      CreatedByID,
      MandatorySkill,
      AdditionalSkills,
      ShortRoleDescription,
      DetailedRoleDescription,
      OpenPositions,
    } = projectDetails;

    let pool = await sql.connect(config);
    const query = `
      INSERT INTO ProjectList (DisplayName, CustomerID, AccountID, PracticeID, Area, CountryID, StateID, ProjectManagerID, 
        DeliveryManagerID, CreatedByID, MandatorySkillID, AdditionalSkills, 
        ShortRoleDescription, DetailedRoleDescription, OpenPositions)
      SELECT
        @DisplayName,
        (SELECT CustomerID FROM CustomersList WHERE Customer = @Customer) AS CustomerID,
        (SELECT AccountID FROM AccountList WHERE Account = @Account) AS AccountID,
        (SELECT PracticeID FROM PracticeList WHERE Practice = @Practice) AS PracticeID,
        @Area,
        (SELECT CountryID FROM CountryList WHERE Country = @Country) AS CountryID,
        (SELECT StateID FROM StateList WHERE StateName = @State) AS StateID,
        @ProjectManagerID,
        @DeliveryManagerID,
        @CreatedByID,
        (SELECT SkillID FROM SkillList WHERE Skill = @MandatorySkill) AS MandatorySkillID,
        @AdditionalSkills,
        @ShortRoleDescription,
        @DetailedRoleDescription,
        @OpenPositions
    `;

    const result = await pool
      .request()
      .input('DisplayName', sql.VarChar(50), DisplayName)
      .input('Customer', sql.VarChar(50), Customer)
      .input('Account', sql.VarChar(50), Account)
      .input('Practice', sql.VarChar(50), Practice)
      .input('Area', sql.VarChar(50), Area)
      .input('Country', sql.VarChar(50), Country)
      .input('State', sql.VarChar(50), State)
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
      .input('OpenPositions', sql.Int, OpenPositions)
      .query(query);

    return result.rowsAffected[0] > 0 ? projectDetails : false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const incrementProjectCount = async (projectDetails) => {
  try {
    let pool = await sql.connect(config);
    const skill = projectDetails.MandatorySkill;
    const query = `UPDATE SkillList SET ProjectCount = ProjectCount + 1 WHERE Skill = @Skill`;

    let result = await pool
      .request()
      .input('Skill', sql.NVarChar(50), skill)
      .query(query);

    return result;
  } catch (error) {
    console.log(error);
  }
};

const getListedProject = async () => {
  try {
    let pool = await sql.connect(config);
    let listedProjects = await pool.request().query(`
      SELECT
        PL.ProjectID,
        PL.DisplayName,
        CL.Customer as Customer,
        AL.Account as Account,
        PCL.Practice as Practice,
        PL.Area,
        COL.Country as Country,
        STL.StateName as State,
        PL.ProjectManagerID,
        ED1.Username as ProjectMangerName,
        PL.DeliveryManagerID,
        ED2.Username as DeliveryManagerName,
        PL.CreatedByID,
        ED3.Username as CreatedByName,
        SL.Skill as MandatorySkill,
        PL.AdditionalSkills,
        PL.ShortRoleDescription,
        PL.DetailedRoleDescription,
        PL.EmployeesApplied,
        PL.AppliedCount,
        PL.OpenPositions
      FROM 
        ProjectList PL
        LEFT JOIN CustomersList CL ON PL.CustomerID = CL.CustomerID
        LEFT JOIN AccountList AL ON PL.AccountID = AL.AccountID
        LEFT JOIN PracticeList PCL ON PL.PracticeID = PCL.PracticeID
        LEFT JOIN CountryList COL ON PL.CountryID = COL.CountryID
        LEFT JOIN StateList STL ON PL.StateID = STL.StateID
        LEFT JOIN EmployeeDetails ED1 ON PL.ProjectManagerID = ED1.EmployeeID
        LEFT JOIN EmployeeDetails ED2 ON PL.DeliveryManagerID = ED2.EmployeeID
        LEFT JOIN EmployeeDetails ED3 ON PL.CreatedByID = ED3.EmployeeID
        LEFT JOIN SkillList SL ON PL.MandatorySkillID = SL.SkillID
        `);

    listedProjects = listedProjects.recordset;
    for (let i in listedProjects) {
      listedProjects[i].AdditionalSkills = listedProjects[
        i
      ].AdditionalSkills.replace(/'/g, '"');
    }
    return listedProjects;
  } catch (error) {
    console.log(error);
  }
};

const getProjectByID = async (ProjectID) => {
  try {
    let pool = await sql.connect(config);
    let listedProject = await pool.request().query(`
      SELECT
        PL.ProjectID,
        PL.DisplayName,
        CL.Customer as Customer,
        AL.Account as Account,
        PCL.Practice as Practice,
        PL.Area,
        COL.Country as Country,
        STL.StateName as State,
        PL.ProjectManagerID,
        ED1.Username as ProjectMangerName,
        PL.DeliveryManagerID,
        ED2.Username as DeliveryManagerName,
        PL.CreatedByID,
        ED3.Username as CreatedByName,
        SL.Skill as MandatorySkill,
        PL.AdditionalSkills,
        PL.ShortRoleDescription,
        PL.DetailedRoleDescription,
        PL.EmployeesApplied,
        PL.AppliedCount,
        PL.OpenPositions
      FROM 
        ProjectList PL
        LEFT JOIN CustomersList CL ON PL.CustomerID = CL.CustomerID
        LEFT JOIN AccountList AL ON PL.AccountID = AL.AccountID
        LEFT JOIN PracticeList PCL ON PL.PracticeID = PCL.PracticeID
        LEFT JOIN CountryList COL ON PL.CountryID = COL.CountryID
        LEFT JOIN StateList STL ON PL.StateID = STL.StateID
        LEFT JOIN EmployeeDetails ED1 ON PL.ProjectManagerID = ED1.EmployeeID
        LEFT JOIN EmployeeDetails ED2 ON PL.DeliveryManagerID = ED2.EmployeeID
        LEFT JOIN EmployeeDetails ED3 ON PL.CreatedByID = ED3.EmployeeID
        LEFT JOIN SkillList SL ON PL.MandatorySkillID = SL.SkillID
      WHERE 
        PL.ProjectID = ${ProjectID}
        `);
    listedProject = listedProject.recordset[0];
    listedProject.AdditionalSkills = listedProject.AdditionalSkills.replace(
      /'/g,
      '"'
    );
    return listedProject;
  } catch (error) {
    console.log(error);
  }
};

const applyToProject = async (EmployeeID, ProjectID) => {
  try {
    let pool = await sql.connect(config);

    // get the array from projectsApplied column to add one more project to it
    let projectsApplied = await pool
      .request()
      .query(
        `SELECT ProjectsApplied FROM EmployeeDetails WHERE EmployeeID = ${EmployeeID}`
      );

    // get the array from EmployeesApplied column to add one more employee to it
    let employeesApplied = await pool
      .request()
      .query(
        `SELECT EmployeesApplied FROM ProjectList WHERE ProjectID = ${ProjectID}`
      );
    projectsApplied = JSON.parse(
      projectsApplied.recordsets[0][0].ProjectsApplied
    );
    employeesApplied = JSON.parse(
      employeesApplied.recordsets[0][0].EmployeesApplied
    );

    // updating the ProjectsApplied in EmployeeDetails with new projectID
    if (projectsApplied === null) {
      projectsApplied = [ProjectID];
    } else if (!projectsApplied.includes(ProjectID)) {
      projectsApplied.push(ProjectID);
    } else {
      return { msg: 'Project already applied' };
    }
    projectsApplied = JSON.stringify(projectsApplied);

    // updating the EmplpoyeesApplied in ProjectList with new EmployeeID
    if (employeesApplied === null) {
      employeesApplied = [EmployeeID];
    } else if (!employeesApplied.includes(EmployeeID)) {
      employeesApplied.push(EmployeeID);
    } else {
      return { msg: 'Project already applied' };
    }
    employeesApplied = JSON.stringify(employeesApplied);

    // updating EmployeeDetails and ProejctList with new array
    let updateEmployeeDetails = await pool
      .request()
      .query(
        `UPDATE EmployeeDetails SET ProjectsApplied = '${projectsApplied}' WHERE EmployeeID = ${EmployeeID}`
      );
    let updateProjectList = await pool
      .request()
      .query(
        `UPDATE ProjectList SET EmployeesApplied = '${employeesApplied}', AppliedCount = AppliedCount + 1 WHERE ProjectID = ${ProjectID}`
      );

    if (
      updateEmployeeDetails.rowsAffected[0] === 1 &&
      updateProjectList.rowsAffected[0] === 1
    ) {
      // getting the updated table now
      const updatedEmployeeDetails = await getEmployees();
      const updatedCurrentEmployee = await getEmployeeByID(EmployeeID);
      const updatedProjectList = await getListedProject();
      const updatedCurrentProject = await getProjectByID(ProjectID);
      return {
        msg: 'Employee sucessfully applied to the project',
        updatedEmployeeDetails: updatedEmployeeDetails,
        updatedCurrentEmployee: updatedCurrentEmployee,
        updatedProjectList: updatedProjectList,
        updatedCurrentProject: updatedCurrentProject,
      };
    } else {
      return { msg: 'Error in applying to the project' };
    }
  } catch (error) {
    console.log(error);
    return { msg: 'Error in applying to the project' };
  }
};

const removeIDFromEmployeeApplied = async (
  query,
  projectInfo,
  employeeInfo
) => {
  try {
    let pool = await sql.connect(config);
    let EmployeesApplied = JSON.parse(projectInfo.EmployeesApplied);
    EmployeesApplied = EmployeesApplied.filter(
      (item) => item != employeeInfo.EmployeeID
    );
    EmployeesApplied =
      EmployeesApplied.length > 0 ? JSON.stringify(EmployeesApplied) : null;
    updateProjectList = await pool
      .request()
      .input('ProjectID', sql.Int, projectInfo.ProjectID)
      .input('EmployeesApplied', sql.VarChar(50), EmployeesApplied)
      .query(query);
    return updateProjectList.rowsAffected[0] === 1;
  } catch (error) {
    console.log(error);
    return {
      msg: 'removeIDFromEmployeeApplied: Error in updating in updating Applicants',
    };
  }
};

const removeIDFromAllProjects = async (projectInfo, employeeInfo) => {
  try {
    let pool = await sql.connect(config);
    let projectsAvailable = await getListedProject();

    for (let project of projectsAvailable) {
      if (project.EmployeesApplied !== null) {
        const oldValue = project.EmployeesApplied;
        let EmployeesApplied = JSON.parse(oldValue);
        EmployeesApplied = EmployeesApplied.filter((id) => {
          return id != employeeInfo.EmployeeID;
        });
        EmployeesApplied =
          EmployeesApplied.length > 0 ? JSON.stringify(EmployeesApplied) : null;
        if (oldValue !== EmployeesApplied) {
          let removeID = await pool
            .request()
            .input('ProjectID', sql.Int, project.ProjectID)
            .input('EmployeesApplied', sql.VarChar(50), EmployeesApplied)
            .query(
              `UPDATE ProjectList SET AppliedCount = AppliedCount - 1, EmployeesApplied=@EmployeesApplied WHERE ProjectID=@ProjectID`
            );
        }
      }
    }
    return true;
  } catch (error) {
    console.log(error);
    return {
      msg: 'removeIDFromAllProjects: Error in updating in updating Applicants',
    };
  }
};

const setProjectAppliedToNull = async (projectInfo, employeeInfo) => {
  try {
    let pool = await sql.connect(config);
    let updateEmployeeDetails = await pool
      .request()
      .input('EmployeeID', sql.Int, employeeInfo.EmployeeID)
      .query(
        `UPDATE EmployeeDetails SET ProjectsApplied=NULL WHERE EmployeeID=@EmployeeID`
      );
    return updateEmployeeDetails.rowsAffected[0] === 1;
  } catch (error) {
    console.log(error);
    return {
      msg: 'setProjectAppliedToNull: Error in updating in updating Applicants',
    };
  }
};
const removeIDFromProjectsApplied = async (projectInfo, employeeInfo) => {
  try {
    let pool = await sql.connect(config);
    let ProjectsApplied = JSON.parse(employeeInfo.ProjectsApplied);
    ProjectsApplied = ProjectsApplied.filter(
      (item) => item != projectInfo.ProjectID
    );

    ProjectsApplied =
      ProjectsApplied.length > 0 ? JSON.stringify(ProjectsApplied) : null;
    let updateEmployeeDetails = await pool
      .request()
      .input('EmployeeID', sql.Int, employeeInfo.EmployeeID)
      .input('ProjectsApplied', sql.VarChar(50), ProjectsApplied)
      .query(
        `UPDATE EmployeeDetails SET ProjectsApplied=@ProjectsApplied WHERE EmployeeID=@EmployeeID`
      );
    return updateEmployeeDetails.rowsAffected[0] === 1;
  } catch (error) {
    console.log(error);
    return {
      msg: 'removeIDFromProjectsApplied: Error in updating in updating Applicants',
    };
  }
};

const updateApplicants = async (type, projectInfo, employeeInfo) => {
  try {
    let pool = await sql.connect(config);
    let updateCheck = false;
    let updateProjectList;
    let updateSkillList = true;
    let updateEmployeeDetails;
    let query;

    switch (type) {
      case 'Approve':
        const positions = projectInfo.OpenPositions;
        if (positions > 1) {
          // If Positions has more than 1 left
          query = `UPDATE ProjectList SET OpenPositions = OpenPositions - 1, AppliedCount = AppliedCount - 1, EmployeesApplied= @EmployeesApplied WHERE ProjectID=@ProjectID`;
          updateProjectList = await removeIDFromEmployeeApplied(
            query,
            projectInfo,
            employeeInfo
          );
          updateProjectList = await removeIDFromAllProjects(
            projectInfo,
            employeeInfo
          );
        } else if (positions === 1) {
          // Removing project from ProjectList
          updateProjectList = await pool
            .request()
            .input('ProjectID', sql.Int, projectInfo.ProjectID)
            .query(`DELETE FROM ProjectList WHERE ProjectID=@ProjectID`);

          updateProjectList = updateProjectList.rowsAffected[0] === 1;
          // Updating SkillList with new ProjectCount
          updateSkillList = await pool
            .request()
            .input('Skill', sql.VarChar(50), projectInfo.MandatorySkill)
            .query(
              `UPDATE SkillList SET ProjectCount = ProjectCount - 1 WHERE Skill=@Skill`
            );

          updateSkillList = updateSkillList.rowsAffected[0] === 1;
        }

        // Updating ProjectsApplied in EmployeeDetails for the employee who got approved
        updateEmployeeDetails = await setProjectAppliedToNull(
          projectInfo,
          employeeInfo
        );

        if (updateProjectList && updateSkillList && updateEmployeeDetails) {
          updateCheck = true;
        }
        break;
      case 'Decline':
        //  Removing the EmployeeID from EmployeeApplied in ProjectList
        query = `UPDATE ProjectList SET AppliedCount = AppliedCount - 1, EmployeesApplied= @EmployeesApplied WHERE ProjectID=@ProjectID`;
        updateProjectList = await removeIDFromEmployeeApplied(
          query,
          projectInfo,
          employeeInfo
        );
        // Updating ProjectsApplied in EmployeeDetails for the employee who got approved
        updateEmployeeDetails = await removeIDFromProjectsApplied(
          projectInfo,
          employeeInfo
        );
        if (updateProjectList && updateEmployeeDetails) {
          updateCheck = true;
        }
        break;
      default:
        break;
    }
    if (updateCheck) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return {
      msg: 'updateApplicants: Error in updating in updating Applicants',
    };
  }
};

module.exports = {
  getEmployees,
  getAllListData,
  getEmployeeByID,
  getEmployeeByIDs,
  registerEmployee,
  updateEmployeeDetails,
  listProject,
  getListedProject,
  getProjectByID,
  incrementProjectCount,
  sortHelperDB,
  applyToProject,
  updateApplicants,
};
