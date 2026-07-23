const mongoose = require('mongoose');

// One document = one audit log entry. Every field is a plain string/date -
// there is no nesting because nothing in the domain data is nested, and no
// sub-schemas or refs because a log record never points at another one.
const AuditLogSchema = new mongoose.Schema(
  {
    actor: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    resource: { type: String, required: true, trim: true },
    resourceType: { type: String, required: true, trim: true },
    ipAddress: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    severity: { type: String, required: true, trim: true, uppercase: true },
    status: { type: String, required: true, trim: true },
    timestamp: { type: Date, required: true },
  },
  { versionKey: false }
);

// Indexes cover every field the API allows filtering or sorting on.
// timestamp is indexed descending because "most recent first" is the
// default sort and the list view's default view of the data.
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ severity: 1 });
AuditLogSchema.index({ status: 1 });
AuditLogSchema.index({ region: 1 });
AuditLogSchema.index({ role: 1 });
AuditLogSchema.index({ resourceType: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ actor: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
