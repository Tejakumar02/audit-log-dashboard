/**
 * Generates a JSON file of randomized audit log records so the bulk-upload
 * endpoint can be exercised without hand-writing 10,000 records.
 *
 * Usage: node scripts/generateSampleData.js [count]
 *   count defaults to 10000.
 */
const fs = require('fs');
const path = require('path');

const ACTORS = [
  'priya.nair@company.com',
  'arjun.mehta@company.com',
  'lucas.silva@company.com',
  'wei.zhang@company.com',
  'fatima.al-sayed@company.com',
  'noah.becker@company.com',
  'grace.kim@company.com',
  'daniel.oduya@company.com',
];
const ROLES = ['admin', 'editor', 'viewer', 'auditor', 'support'];
const ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE_USER',
  'UPDATE_USER',
  'DELETE_USER',
  'VIEW_RECORD',
  'EXPORT_DATA',
  'UPDATE_PERMISSIONS',
  'DELETE_RECORD',
  'RESET_PASSWORD',
  'ACCESS_DENIED',
];
const RESOURCE_TYPES = ['USER', 'RECORD', 'FILE', 'PERMISSION', 'SYSTEM', 'REPORT'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['Unresolved', 'In Progress', 'Resolved', 'Ignored'];
const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1', 'ap-southeast-1', 'sa-east-1'];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomIp() {
  return `${1 + Math.floor(Math.random() * 223)}.${Math.floor(Math.random() * 256)}.${Math.floor(
    Math.random() * 256
  )}.${Math.floor(Math.random() * 256)}`;
}

function randomTimestamp() {
  const start = new Date('2025-01-01T00:00:00Z').getTime();
  const end = new Date('2025-12-31T23:59:59Z').getTime();
  return new Date(start + Math.random() * (end - start)).toISOString();
}

function buildRecord() {
  const resourceType = pick(RESOURCE_TYPES);
  const idNumber = 100 + Math.floor(Math.random() * 900);
  return {
    actor: pick(ACTORS),
    role: pick(ROLES),
    action: pick(ACTIONS),
    resource: `/api/${resourceType.toLowerCase()}s/${idNumber}`,
    resourceType,
    ipAddress: randomIp(),
    region: pick(REGIONS),
    severity: pick(SEVERITIES),
    status: pick(STATUSES),
    timestamp: randomTimestamp(),
  };
}

const count = parseInt(process.argv[2], 10) || 10000;
const records = Array.from({ length: count }, buildRecord);

const outDir = path.join(__dirname, '..', 'sample-data');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `sample-logs-${count}.json`);
fs.writeFileSync(outPath, JSON.stringify(records));

console.log(`Wrote ${count} records to ${outPath}`);
