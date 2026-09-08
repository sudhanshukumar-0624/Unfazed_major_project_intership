const express = require('express');
const router = express.Router();
const {
  getClients, getClient, createClient, updateClient, deleteClient, submitIntake,
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

// All private (therapist must be logged in)
router.get('/', protect, getClients);
router.post('/', protect, createClient);
router.get('/:id', protect, getClient);
router.put('/:id', protect, updateClient);
router.delete('/:id', protect, deleteClient);

// Public (client portal — intake form submission)
router.post('/:id/intake', submitIntake);

module.exports = router;
