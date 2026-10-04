const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// ── SUBMIT CONTACT FORM ──  POST /api/contact
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        const contact = await Contact.create({ name, email, message });

        res.status(201).json({
            message: 'Message received! We will get back to you soon.',
            contact: {
                id: contact._id,
                name: contact.name,
                email: contact.email,
                submittedAt: contact.submittedAt
            }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;
