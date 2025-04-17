function generateVerificationCode() {
    const code = Math.floor(1000 + Math.random() * 9000);  // 4-digit number
    return code.toString();
  }
  
  module.exports = generateVerificationCode;
  