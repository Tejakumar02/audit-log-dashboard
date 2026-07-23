const AuditLog = require('../models/AuditLog');
const {
  REQUIRED_FIELDS,
  FILTERABLE_FIELDS,
  SORTABLE_FIELDS,
  SEARCHABLE_FIELDS,
  FACET_FIELDS,
} = require('../constants/fields');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Validates one raw record from an uploaded file and returns either
// { doc } ready for insertMany, or { error } explaining why it was skipped.
// This runs in memory before anything reaches MongoDB, so a file full of
// bad rows never costs a database round trip.
function toDocOrError(record, index) {
  if (typeof record !== 'object' || record === null || Array.isArray(record)) {
    return { error: { index, reason: 'Not a JSON object' } };
  }

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = record[field];
    return value === undefined || value === null || value === '';
  });
  if (missing.length > 0) {
    return { error: { index, reason: `Missing field(s): ${missing.join(', ')}` } };
  }

  const timestamp = new Date(record.timestamp);
  if (Number.isNaN(timestamp.getTime())) {
    return { error: { index, reason: `Invalid timestamp: "${record.timestamp}"` } };
  }

  const doc = {
    actor: String(record.actor),
    role: String(record.role),
    action: String(record.action),
    resource: String(record.resource),
    resourceType: String(record.resourceType),
    ipAddress: String(record.ipAddress),
    region: String(record.region),
    severity: String(record.severity).toUpperCase(),
    status: String(record.status),
    timestamp,
  };

  return { doc };
}

// POST /api/logs/bulk  (multipart/form-data, field name "file")
async function bulkUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Attach a JSON file under the "file" field.' });
  }

  let records;
  try {
    records = JSON.parse(req.file.buffer.toString('utf-8'));
  } catch {
    return res.status(400).json({ error: 'The uploaded file is not valid JSON.' });
  }

  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'The JSON file must contain an array of log records.' });
  }
  if (records.length === 0) {
    return res.status(400).json({ error: 'The file contains no records.' });
  }

  const docs = [];
  const rejected = [];
  records.forEach((record, index) => {
    const { doc, error } = toDocOrError(record, index);
    if (error) rejected.push(error);
    else docs.push(doc);
  });

  if (docs.length === 0) {
    return res.status(400).json({
      error: 'No valid records to insert.',
      rejectedCount: rejected.length,
      sampleErrors: rejected.slice(0, 10),
    });
  }

  // ordered:false lets MongoDB insert every valid document even if one in
  // the middle of the batch fails a driver-level check, instead of
  // stopping at the first failure. When that happens the driver throws
  // even though the other documents were saved, so the successful count
  // has to be read off the error object rather than treated as "0 saved".
  let insertedCount;
  try {
    const inserted = await AuditLog.insertMany(docs, { ordered: false });
    insertedCount = inserted.length;
  } catch (err) {
    insertedCount = err.insertedDocs ? err.insertedDocs.length : 0;
    if (Array.isArray(err.writeErrors)) {
      err.writeErrors.forEach((we) => {
        rejected.push({ index: 'n/a', reason: we.errmsg || 'Database rejected this document' });
      });
    }
  }

  res.status(201).json({
    receivedCount: records.length,
    insertedCount,
    rejectedCount: rejected.length,
    sampleErrors: rejected.slice(0, 10),
  });
}

// GET /api/logs?search=&severity=&status=&region=&role=&resourceType=&action=
//     &ipAddress=&dateFrom=&dateTo=&sortBy=&order=&page=&limit=
async function getLogs(req, res) {
  const { search, sortBy, order, page, limit, dateFrom, dateTo, ipAddress } = req.query;

  const filter = {};

  FILTERABLE_FIELDS.forEach((field) => {
    const raw = req.query[field];
    if (!raw) return;
    const values = String(raw)
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 1) filter[field] = values[0];
    else if (values.length > 1) filter[field] = { $in: values };
  });

  if (ipAddress) {
    filter.ipAddress = { $regex: escapeRegex(ipAddress), $options: 'i' };
  }

  if (dateFrom || dateTo) {
    filter.timestamp = {};
    if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
    if (dateTo) filter.timestamp.$lte = new Date(dateTo);
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = SEARCHABLE_FIELDS.map((field) => ({ [field]: pattern }));
  }

  const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'timestamp';
  const sortOrder = order === 'asc' ? 1 : -1;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);

  const [data, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ [sortField]: sortOrder, _id: 1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    data,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
}

// GET /api/logs/facets - distinct values for every closed-vocabulary field,
// so filter dropdowns always reflect what's actually in the database
// instead of a hardcoded guess.
async function getFacets(req, res) {
  const results = await Promise.all(FACET_FIELDS.map((field) => AuditLog.distinct(field)));
  const facets = {};
  FACET_FIELDS.forEach((field, i) => {
    facets[field] = results[i].sort();
  });
  res.json(facets);
}

module.exports = { bulkUpload, getLogs, getFacets };
