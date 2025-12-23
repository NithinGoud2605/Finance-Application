const { Validator } = require('node-input-validator');

exports.validateInput = async (data, rules) => {
  const v = new Validator(data, rules);
  const matched = await v.check();
  
  if (!matched) {
    const errors = Object.values(v.errors).map(err => err.message);
    throw new Error(errors.join(', '));
  }
};