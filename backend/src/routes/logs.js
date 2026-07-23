const router = require('express').Router();
const upload = require('../middleware/upload');
const { bulkUpload, getLogs, getFacets } = require('../controllers/logsController');

// Express 4 does not forward a rejected promise to the error handler on its
// own - without this, a thrown error in an async controller would crash
// the process instead of returning a 500. This one function replaces the
// need for a try/catch block in every controller.
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.post('/bulk', upload.single('file'), asyncHandler(bulkUpload));
router.get('/facets', asyncHandler(getFacets));
router.get('/', asyncHandler(getLogs));

module.exports = router;
