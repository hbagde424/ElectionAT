const express = require('express');
const { sendContactEmail, getHelpCenterInfo } = require('../controllers/helpCenterController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Help Center
 *   description: Help center and contact form endpoints
 */

/**
 * @swagger
 * /api/help-center/contact:
 *   post:
 *     summary: Send contact form email
 *     tags: [Help Center]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - mobile
 *               - email
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: "John Doe"
 *               mobile:
 *                 type: string
 *                 pattern: "^[6-9]\\d{9}$"
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 example: "I need help with my account setup..."
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Your message has been sent successfully! We will get back to you soon."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "All fields are required"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to send message. Please try again later."
 */
router.post('/contact', sendContactEmail);

/**
 * @swagger
 * /api/help-center/info:
 *   get:
 *     summary: Get help center contact information
 *     tags: [Help Center]
 *     responses:
 *       200:
 *         description: Help center information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "support@electionat.com"
 *                     mobile:
 *                       type: string
 *                       example: "+91 98765 43210"
 *                     whatsapp:
 *                       type: string
 *                       example: "+91 98765 43210"
 *                     office:
 *                       type: object
 *                       properties:
 *                         address:
 *                           type: string
 *                         city:
 *                           type: string
 *                         state:
 *                           type: string
 *                         pincode:
 *                           type: string
 *                     workingHours:
 *                       type: object
 *                       properties:
 *                         weekdays:
 *                           type: string
 *                         saturday:
 *                           type: string
 *                         sunday:
 *                           type: string
 *       500:
 *         description: Server error
 */
router.get('/info', getHelpCenterInfo);

module.exports = router;