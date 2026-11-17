const success = (data, meta) => ({ status: 'success', data, ...(meta ? { meta } : {}) });
module.exports = { success };
