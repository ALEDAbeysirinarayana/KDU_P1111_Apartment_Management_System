const nodemailer = require('nodemailer');
require('dotenv').config();

// ─── Transporter ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Shared HTML wrapper ────────────────────────────────────────────────────────
const buildHtml = (title, accentColor, bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, ${accentColor} 0%, #1a1a2e 100%); padding: 36px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header p  { margin: 6px 0 0; color: rgba(255,255,255,0.75); font-size: 13px; }
    .body      { padding: 36px 40px; color: #374151; }
    .body h2   { font-size: 20px; margin: 0 0 12px; color: #111827; }
    .body p    { font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .badge     { display: inline-block; padding: 6px 18px; border-radius: 50px; font-size: 13px; font-weight: 600; letter-spacing: 0.4px; margin-bottom: 20px; }
    .badge.green  { background: #d1fae5; color: #065f46; }
    .badge.red    { background: #fee2e2; color: #991b1b; }
    .badge.blue   { background: #dbeafe; color: #1e40af; }
    .divider   { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .footer    { background: #f9fafb; padding: 20px 40px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
    .footer strong { color: #6b7280; }
    .btn { display: inline-block; margin-top: 8px; padding: 12px 28px; background: ${accentColor}; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏢 Apartment Management System</h1>
      <p>Automated Notification</p>
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>This is an automated message from <strong>AMS — KDU</strong>.<br/>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── 1. Registration Confirmation ──────────────────────────────────────────────
/**
 * Sent to the new user immediately after successful registration.
 * @param {{ email: string, fullName: string, role: string }} user
 */
const sendRegistrationEmail = async (user) => {
  const { email, fullName, role } = user;
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  const body = `
    <h2>Welcome, ${fullName || email}!</h2>
    <span class="badge blue">Registration Received</span>
    <p>Thank you for registering with the <strong>Apartment Management System</strong>.</p>
    <p>Your account has been created with the role of <strong>${displayRole}</strong>. Your application is currently <strong>pending review</strong> by our management team.</p>
    <hr class="divider" />
    <p><strong>What happens next?</strong></p>
    <p>
      ${role === 'tenant'
        ? '① Your linked homeowner will review and approve your tenancy request.<br/>② After homeowner approval, our Admin team will do a final review.<br/>③ You will receive a separate email once a decision is made.'
        : '① Our Admin team will review your application shortly.<br/>② You will receive an email once a decision has been made.<br/>③ Once approved, you can log in and access your resident dashboard.'
      }
    </p>
    <hr class="divider" />
    <p style="font-size:13px; color:#6b7280;">If you did not create this account, please contact the management office immediately.</p>
  `;

  await transporter.sendMail({
    from: `"AMS – Apartment Management" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '📋 Your AMS Registration is Under Review',
    html: buildHtml('Registration Received', '#4f46e5', body),
  });

  console.log(`[Email] Registration confirmation sent to ${email}`);
};

// ─── 2. Admin Approval / Rejection ─────────────────────────────────────────────
/**
 * Sent when an Admin or Staff approves or rejects a homeowner or tenant.
 * @param {{ email: string, full_name: string, role: string }} targetUser
 * @param {'approve' | 'reject'} action
 */
const sendAdminApprovalEmail = async (targetUser, action) => {
  const { email, full_name, role } = targetUser;
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);
  const isApproved = action === 'approve';

  const subject = isApproved
    ? `✅ Your AMS ${displayRole} Account Has Been Approved`
    : `❌ Your AMS ${displayRole} Registration Was Not Approved`;

  const badge = isApproved
    ? `<span class="badge green">✅ Approved by Admin</span>`
    : `<span class="badge red">❌ Rejected by Admin</span>`;

  const body = `
    <h2>Hello, ${full_name || email}!</h2>
    ${badge}
    <p>
      ${isApproved
        ? `Great news! The Admin team has <strong>approved</strong> your ${displayRole.toLowerCase()} account. You can now log in to the Apartment Management System and access your dashboard.`
        : `We regret to inform you that the Admin team has <strong>not approved</strong> your ${displayRole.toLowerCase()} registration at this time.`
      }
    </p>
    <hr class="divider" />
    ${isApproved
      ? `<p>To get started, log in at the resident portal using your registered email address.</p>`
      : `<p>If you believe this decision was made in error, or you have questions, please contact the apartment management office directly.</p>`
    }
    <hr class="divider" />
    <p style="font-size:13px; color:#6b7280;">This decision was made by an authorised Admin or Staff member of the Apartment Management System.</p>
  `;

  await transporter.sendMail({
    from: `"AMS – Apartment Management" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: buildHtml(subject, isApproved ? '#059669' : '#dc2626', body),
  });

  console.log(`[Email] Admin ${action} notification sent to ${email}`);
};

// ─── 3. Homeowner Approval / Rejection of Tenant ───────────────────────────────
/**
 * Sent when a Homeowner approves or rejects a tenant's request.
 * @param {{ email: string, full_name: string }} tenantUser
 * @param {'approve' | 'reject'} action
 */
const sendOwnerApprovalEmail = async (tenantUser, action) => {
  const { email, full_name } = tenantUser;
  const isApproved = action === 'approve';

  const subject = isApproved
    ? '✅ Your Tenancy Request Has Been Approved by the Homeowner'
    : '❌ Your Tenancy Request Was Rejected by the Homeowner';

  const badge = isApproved
    ? `<span class="badge green">✅ Homeowner Approved</span>`
    : `<span class="badge red">❌ Homeowner Rejected</span>`;

  const body = `
    <h2>Hello, ${full_name || email}!</h2>
    ${badge}
    <p>
      ${isApproved
        ? `The homeowner linked to your account has <strong>approved</strong> your tenancy request.`
        : `The homeowner linked to your account has <strong>rejected</strong> your tenancy request.`
      }
    </p>
    <hr class="divider" />
    ${isApproved
      ? `<p><strong>What happens next?</strong><br/>Your application has been forwarded to our Admin team for a final review. You will receive another email once the Admin team makes their decision.</p>`
      : `<p>If you believe this was an error, please contact the apartment management office or speak with your homeowner directly.</p>`
    }
    <hr class="divider" />
    <p style="font-size:13px; color:#6b7280;">This notification was triggered by a homeowner action in the Apartment Management System.</p>
  `;

  await transporter.sendMail({
    from: `"AMS – Apartment Management" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: buildHtml(subject, isApproved ? '#059669' : '#dc2626', body),
  });

  console.log(`[Email] Homeowner ${action} notification sent to ${email}`);
};

// ─── 4. Invoice Notification ───────────────────────────────────────────────────
/**
 * Sent when an Admin generates a new invoice for a user/unit.
 * @param {{ email: string, residentName: string, invoiceId: string, amount: number|string, description: string, dueDate: string, unitInfo: string, paymentMethod: string }} invoiceData
 */
const sendInvoiceEmail = async (invoiceData) => {
  const { email, residentName, invoiceId, amount, description, dueDate, unitInfo, paymentMethod } = invoiceData;

  const formattedAmount = parseFloat(amount || 0).toFixed(2);

  const body = `
    <h2>New Invoice Issued</h2>
    <span class="badge blue">Invoice #${invoiceId}</span>
    <p>Dear <strong>${residentName || 'Resident'}</strong>,</p>
    <p>A new invoice has been generated for your unit (<strong>${unitInfo || 'Apartment Unit'}</strong>).</p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; font-size: 14px; color: #374151; border-collapse: collapse;">
        <tr style="border-bottom: 1px dashed #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Invoice Reference:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #111827;">${invoiceId}</td>
        </tr>
        <tr style="border-bottom: 1px dashed #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Amount Due:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #2563eb; font-size: 18px;">$${formattedAmount}</td>
        </tr>
        <tr style="border-bottom: 1px dashed #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Description:</td>
          <td style="padding: 8px 0; text-align: right;">${description}</td>
        </tr>
        <tr style="border-bottom: 1px dashed #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Due Date:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #dc2626;">${dueDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Payment Method:</td>
          <td style="padding: 8px 0; text-align: right;">${paymentMethod || 'Bank Transfer'}</td>
        </tr>
      </table>
    </div>

    <p>Please ensure payment is completed on or before the due date.</p>
    <hr class="divider" />
    <p style="font-size:13px; color:#6b7280;">Log in to your Resident Dashboard to view invoice history and pay online.</p>
  `;

  await transporter.sendMail({
    from: `"AMS – Apartment Management" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `📄 New Invoice #${invoiceId} ($${formattedAmount}) - Action Required`,
    html: buildHtml(`Invoice #${invoiceId}`, '#2563eb', body),
  });

  console.log(`[Email] Invoice notification sent to ${email} for invoice ${invoiceId}`);
};

// ─── 5. Complaint Assigned — Staff Notification ─────────────────────────────────
/**
 * Sent to the assigned staff/maintenance worker when a complaint is assigned to them.
 * @param {{ email: string, staffName: string, ticketId: string, category: string, priority: string, description: string, residentName: string, residentUnit: string }} data
 */
const sendComplaintAssignedEmail = async (data) => {
  const { email, staffName, ticketId, category, priority, description, residentName, residentUnit } = data;

  const priorityColor = priority === 'emergency' ? '#dc2626' : priority === 'high' ? '#d97706' : '#2563eb';
  const priorityBadge = `<span style="display:inline-block;padding:4px 14px;border-radius:50px;font-size:12px;font-weight:700;background:${priority === 'emergency' ? '#fee2e2' : priority === 'high' ? '#fef3c7' : '#dbeafe'};color:${priorityColor};margin-bottom:16px;">${priority.toUpperCase()} PRIORITY</span>`;

  const body = `
    <h2>🔧 New Complaint Ticket Assigned to You</h2>
    ${priorityBadge}
    <p>Dear <strong>${staffName || 'Staff Member'}</strong>,</p>
    <p>A maintenance/complaint ticket has been assigned to you. Please review the details below and take appropriate action.</p>

    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;">
      <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;">
        <tr style="border-bottom:1px dashed #e5e7eb;">
          <td style="padding:8px 0;color:#6b7280;font-weight:600;">Ticket ID:</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;color:#111827;">${ticketId}</td>
        </tr>
        <tr style="border-bottom:1px dashed #e5e7eb;">
          <td style="padding:8px 0;color:#6b7280;font-weight:600;">Category:</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;color:#111827;">${category}</td>
        </tr>
        <tr style="border-bottom:1px dashed #e5e7eb;">
          <td style="padding:8px 0;color:#6b7280;font-weight:600;">Reported by:</td>
          <td style="padding:8px 0;text-align:right;">${residentName || 'Resident'} (${residentUnit || 'Unit N/A'})</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-weight:600;vertical-align:top;">Description:</td>
          <td style="padding:8px 0;text-align:right;font-style:italic;color:#374151;">"${description}"</td>
        </tr>
      </table>
    </div>

    <p>Please log in to the Apartment Management System to view full details and update the ticket status as you progress.</p>
    <hr class="divider" />
    <p style="font-size:13px;color:#6b7280;">If you believe this was assigned to you in error, please contact the administration team.</p>
  `;

  await transporter.sendMail({
    from: `"AMS – Apartment Management" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔧 [Ticket ${ticketId}] New Complaint Assigned — ${category} (${priority.toUpperCase()})`,
    html: buildHtml(`Ticket Assigned: ${ticketId}`, priorityColor, body),
  });

  console.log(`[Email] Complaint assignment notification sent to staff ${email} for ticket ${ticketId}`);
};

// ─── 6. Complaint Status Updated — Resident Notification ────────────────────────
/**
 * Sent to the resident when their complaint ticket status changes.
 * @param {{ email: string, residentName: string, ticketId: string, category: string, newStatus: string, description: string, assignedStaffName: string }} data
 */
const sendComplaintStatusEmail = async (data) => {
  const { email, residentName, ticketId, category, newStatus, description, assignedStaffName } = data;

  const statusLabels = {
    pending: { label: 'Pending Review', color: '#d97706', bg: '#fef3c7', icon: '⏳' },
    in_progress: { label: 'In Progress', color: '#2563eb', bg: '#dbeafe', icon: '🔧' },
    resolved: { label: 'Resolved', color: '#059669', bg: '#d1fae5', icon: '✅' },
    emergency: { label: 'Emergency', color: '#dc2626', bg: '#fee2e2', icon: '🚨' },
  };

  const st = statusLabels[newStatus] || { label: newStatus, color: '#6b7280', bg: '#f3f4f6', icon: '📋' };
  const badge = `<span style="display:inline-block;padding:6px 18px;border-radius:50px;font-size:13px;font-weight:700;background:${st.bg};color:${st.color};margin-bottom:16px;">${st.icon} ${st.label}</span>`;

  const body = `
    <h2>Your Complaint Ticket Has Been Updated</h2>
    ${badge}
    <p>Dear <strong>${residentName || 'Resident'}</strong>,</p>
    <p>Your complaint/maintenance request (Ticket <strong>${ticketId}</strong>) has been updated to the status: <strong style="color:${st.color};">${st.label}</strong>.</p>

    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;">
      <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;">
        <tr style="border-bottom:1px dashed #e5e7eb;">
          <td style="padding:8px 0;color:#6b7280;font-weight:600;">Ticket ID:</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;">${ticketId}</td>
        </tr>
        <tr style="border-bottom:1px dashed #e5e7eb;">
          <td style="padding:8px 0;color:#6b7280;font-weight:600;">Category:</td>
          <td style="padding:8px 0;text-align:right;">${category}</td>
        </tr>
        <tr style="border-bottom:1px dashed #e5e7eb;">
          <td style="padding:8px 0;color:#6b7280;font-weight:600;">New Status:</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;color:${st.color};">${st.icon} ${st.label}</td>
        </tr>
        ${assignedStaffName ? `<tr style="border-bottom:1px dashed #e5e7eb;"><td style="padding:8px 0;color:#6b7280;font-weight:600;">Assigned To:</td><td style="padding:8px 0;text-align:right;">${assignedStaffName}</td></tr>` : ''}
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-weight:600;vertical-align:top;">Your Request:</td>
          <td style="padding:8px 0;text-align:right;font-style:italic;color:#374151;">"${description}"</td>
        </tr>
      </table>
    </div>

    ${newStatus === 'resolved' ? '<p>✅ Your issue has been <strong>resolved</strong>. If the problem persists, please submit a new complaint through your Resident Dashboard.</p>' : '<p>Our team is working on your request. You will receive further updates as the ticket progresses.</p>'}
    <hr class="divider" />
    <p style="font-size:13px;color:#6b7280;">Log in to your Resident Dashboard to view full complaint history.</p>
  `;

  await transporter.sendMail({
    from: `"AMS – Apartment Management" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${st.icon} [Ticket ${ticketId}] Your Complaint Status — ${st.label}`,
    html: buildHtml(`Ticket Update: ${ticketId}`, st.color, body),
  });

  console.log(`[Email] Complaint status notification sent to resident ${email} for ticket ${ticketId} — ${newStatus}`);
};

module.exports = {
  sendRegistrationEmail,
  sendAdminApprovalEmail,
  sendOwnerApprovalEmail,
  sendInvoiceEmail,
  sendComplaintAssignedEmail,
  sendComplaintStatusEmail,
};

