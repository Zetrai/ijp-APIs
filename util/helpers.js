const bcrypt = require('bcrypt');

// Helper function to hash a password
const hashPassword = (plainPassword) => {
  const saltRounds = 10;
  return bcrypt.hashSync(plainPassword, saltRounds);
};

// Helper function to verify a password
const verifyPassword = (plainPassword, hashedPassword) => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

// // Usage example
// const plainPassword = 'mysecurepassword';
// const hashedPassword = hashPassword(plainPassword);
// console.log('Hashed Password:', hashedPassword);

// const passwordMatches = verifyPassword(plainPassword, hashedPassword);
// if (passwordMatches) {
//   console.log('Password is correct.');
// } else {
//   console.log('Password is incorrect.');
// }

module.exports = {
  hashPassword: hashPassword,
  verifyPassword: verifyPassword,
};
