const crypto = require('crypto');

async function generateUniqueReferenceId(GrievanceModel) {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const randomNum = crypto.randomInt(100000, 999999);
    const referenceId = `KL-CMO-${year}-${randomNum}`;
    const exists = await GrievanceModel.exists({ referenceId });
    if (!exists) {
      return referenceId;
    }
  }

  const fallbackToken = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `KL-CMO-${year}-${fallbackToken}`;
}

module.exports = {
  generateUniqueReferenceId,
};
