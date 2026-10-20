/**
 * Helper to ensure Date objects for MySQL @db.Date columns (e.g. attendance_date)
 * match UTC 00:00:00 of the LOCAL calendar date, preventing timezone offset bugs
 * where local evening hours roll back to previous day UTC and cause unique key constraint violations.
 */
function getLocalDateOnly(d = new Date()) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

module.exports = {
  getLocalDateOnly,
};
