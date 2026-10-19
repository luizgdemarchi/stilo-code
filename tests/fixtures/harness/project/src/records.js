// Fixture deliberadamente falha: faltam validação de identidade e isolamento de tenants.
const records = [
  { id: 'a1', tenantId: 'alpha', value: 'registro alpha' },
  { id: 'b1', tenantId: 'beta', value: 'registro beta' },
];
function readRecord(actor, recordId) {
  const record = records.find(item => item.id === recordId);
  return record ? { ...record } : null;
}
module.exports = { readRecord };
