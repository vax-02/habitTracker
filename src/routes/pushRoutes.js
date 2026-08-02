const express = require('express');
const { authenticate } = require('../middlewares/auth');
const {
  getVapidPublicKey,
  subscribe,
  unsubscribe
} = require('../controllers/pushController');

const router = express.Router();

// Rutas protegidas
router.use(authenticate);

router.get('/vapid-key', getVapidPublicKey);
router.post('/subscribe', subscribe);
router.delete('/subscribe', unsubscribe);

module.exports = router;