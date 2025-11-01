import Contact from '../models/Contact.js';
import emailService from '../services/email.service.js';

/**
 * Submit contact form
 */
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, category, subject, message } = req.body;

    // Validation
    if (!name || !email || !category || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Create contact record
    const contact = new Contact({
      name,
      email,
      category,
      subject,
      message,
      status: 'new',
      userId: req.user?.userId || null // If user is logged in
    });

    await contact.save();

    // Send confirmation email to user
    try {
      await emailService.sendEmail(
        email,
        'We received your message - Resume Analyzer',
        'contact-confirmation',
        {
          name,
          subject,
          message
        }
      );
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }

    // Send notification to admin
    try {
      await emailService.sendEmail(
        process.env.ADMIN_EMAIL || 'support@resumeanalyzer.com',
        `New Contact Form: ${category} - ${subject}`,
        'contact-admin-notification',
        {
          name,
          email,
          category,
          subject,
          message,
          contactId: contact._id
        }
      );
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
    }

    res.json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you soon!',
      contactId: contact._id
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact form. Please try again.'
    });
  }
};

/**
 * Get all contact messages (Admin only)
 */
export const getAllContacts = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Contact.countDocuments(query);

    res.json({
      success: true,
      contacts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact messages'
    });
  }
};

/**
 * Update contact status (Admin only)
 */
export const updateContactStatus = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { status, response } = req.body;

    const contact = await Contact.findById(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found'
      });
    }

    contact.status = status;
    if (response) {
      contact.response = response;
      contact.respondedAt = new Date();
      contact.respondedBy = req.user.userId;
    }

    await contact.save();

    // Send response email to user if provided
    if (response) {
      try {
        await emailService.sendEmail(
          contact.email,
          `Re: ${contact.subject}`,
          'contact-response',
          {
            name: contact.name,
            originalMessage: contact.message,
            response
          }
        );
      } catch (emailError) {
        console.error('Error sending response email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Contact status updated successfully',
      contact
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact status'
    });
  }
};

/**
 * Get contact statistics (Admin only)
 */
export const getContactStats = async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const newContacts = await Contact.countDocuments({ status: 'new' });
    const inProgressContacts = await Contact.countDocuments({ status: 'in-progress' });
    const resolvedContacts = await Contact.countDocuments({ status: 'resolved' });

    const categoryStats = await Contact.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total: totalContacts,
        new: newContacts,
        inProgress: inProgressContacts,
        resolved: resolvedContacts,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact statistics'
    });
  }
};
