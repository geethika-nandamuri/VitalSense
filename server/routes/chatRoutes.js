const express = require('express');
const { chat } = require('../services/llmService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await chat(message, req.user, history);
    res.json(result);
  } catch (error) {
    console.error('Chat route error:', error.message);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

module.exports = router;
