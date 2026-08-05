const pool = require('../config/db');
const { sendInvoiceEmail } = require('../utils/emailService');

// @desc    Get all bills (admin) with metrics, monthly collection, overdue list, transactions
// @route   GET /api/bills
// @access  Private
const getBills = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    if (role === 'admin' || role === 'staff') {
      const { search, status, page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let conditions = [];
      let params = [];

      if (search && search.trim() !== '') {
        conditions.push(`(b.invoice_id LIKE ? OR b.description LIKE ? OR u.block_name LIKE ? OR u.unit_number LIKE ? OR res.full_name LIKE ? OR own.full_name LIKE ?)`);
        const sp = `%${search.trim()}%`;
        params.push(sp, sp, sp, sp, sp, sp);
      }

      if (status && status !== 'All') {
        conditions.push('b.status = ?');
        params.push(status.toLowerCase());
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      const [bills] = await pool.query(`
        SELECT b.*, 
               u.block_name, u.floor_number, u.unit_number,
               COALESCE(res.full_name, own.full_name, 'N/A') AS resident_name
        FROM bills b
        JOIN units u ON b.unit_id = u.id
        LEFT JOIN users res ON u.tenant_id = res.id
        LEFT JOIN users own ON u.owner_id = own.id
        ${whereClause}
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      const [totalRes] = await pool.query(`
        SELECT COUNT(*) AS count 
        FROM bills b
        JOIN units u ON b.unit_id = u.id
        LEFT JOIN users res ON u.tenant_id = res.id
        LEFT JOIN users own ON u.owner_id = own.id
        ${whereClause}
      `, params);

      // Metrics
      const [[metricsRes]] = await pool.query(`
        SELECT 
          COUNT(*) AS totalInvoices,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paymentsCollected,
          SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) AS pendingAmount,
          COUNT(CASE WHEN status = 'unpaid' THEN 1 END) AS pendingCount,
          SUM(CASE WHEN status = 'unpaid' AND due_date < CURDATE() THEN amount ELSE 0 END) AS overdueAmount,
          COUNT(CASE WHEN status = 'unpaid' AND due_date < CURDATE() THEN 1 END) AS overdueCount
        FROM bills
      `);

      // Monthly collection for last 6 months
      const [monthlyData] = await pool.query(`
        SELECT 
          DATE_FORMAT(paid_at, '%b') AS month,
          DATE_FORMAT(paid_at, '%Y-%m') AS month_key,
          SUM(amount) AS collected
        FROM bills 
        WHERE status = 'paid' AND paid_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month_key, month
        ORDER BY month_key ASC
      `);

      // Top overdue bills
      const [overdueList] = await pool.query(`
        SELECT b.id, b.invoice_id, b.amount, b.due_date, b.description,
               u.block_name, u.unit_number,
               COALESCE(res.full_name, own.full_name, 'Resident') AS resident_name,
               DATEDIFF(CURDATE(), b.due_date) AS days_overdue
        FROM bills b
        JOIN units u ON b.unit_id = u.id
        LEFT JOIN users res ON u.tenant_id = res.id
        LEFT JOIN users own ON u.owner_id = own.id
        WHERE b.status = 'unpaid' AND b.due_date < CURDATE()
        ORDER BY b.due_date ASC
        LIMIT 5
      `);

      // Recent transactions
      const [transactions] = await pool.query(`
        SELECT pt.*, 
               b.invoice_id, b.description,
               u.block_name, u.unit_number,
               COALESCE(res.full_name, own.full_name, 'N/A') AS resident_name
        FROM payment_transactions pt
        JOIN bills b ON pt.bill_id = b.id
        JOIN units u ON pt.unit_id = u.id
        LEFT JOIN users res ON u.tenant_id = res.id
        LEFT JOIN users own ON u.owner_id = own.id
        ORDER BY pt.created_at DESC
        LIMIT 10
      `);

      return res.status(200).json({
        bills,
        total: totalRes[0].count,
        page: parseInt(page),
        metrics: {
          totalInvoices: metricsRes.totalInvoices || 0,
          paymentsCollected: parseFloat(metricsRes.paymentsCollected || 0),
          pendingAmount: parseFloat(metricsRes.pendingAmount || 0),
          pendingCount: metricsRes.pendingCount || 0,
          overdueAmount: parseFloat(metricsRes.overdueAmount || 0),
          overdueCount: metricsRes.overdueCount || 0
        },
        monthlyCollection: monthlyData,
        overdueList,
        transactions
      });
    } else {
      // Resident view – their own bills with full metrics + transactions
      let unitQuery = role === 'homeowner'
        ? 'SELECT id FROM units WHERE owner_id = ?'
        : 'SELECT id FROM units WHERE tenant_id = ?';
      const [units] = await pool.query(unitQuery, [userId]);
      if (units.length === 0) return res.status(200).json({ bills: [], metrics: {}, transactions: [] });

      const unitId = units[0].id;
      const [bills] = await pool.query(`
        SELECT * FROM bills WHERE unit_id = ? ORDER BY due_date DESC
      `, [unitId]);

      // Metrics for this unit
      const [[metrics]] = await pool.query(`
        SELECT
          COUNT(*) AS totalInvoices,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS totalPaid,
          SUM(CASE WHEN status = 'unpaid' THEN amount ELSE 0 END) AS pendingAmount,
          COUNT(CASE WHEN status = 'unpaid' THEN 1 END) AS pendingCount,
          SUM(CASE WHEN status = 'unpaid' AND due_date < CURDATE() THEN amount ELSE 0 END) AS overdueAmount,
          COUNT(CASE WHEN status = 'unpaid' AND due_date < CURDATE() THEN 1 END) AS overdueCount
        FROM bills WHERE unit_id = ?
      `, [unitId]);

      // Outstanding unpaid bills (for the outstanding card)
      const [unpaidBills] = await pool.query(`
        SELECT * FROM bills WHERE unit_id = ? AND status = 'unpaid' ORDER BY due_date ASC LIMIT 1
      `, [unitId]);

      // Transactions for this unit
      const [transactions] = await pool.query(`
        SELECT pt.*, b.invoice_id, b.description
        FROM payment_transactions pt
        JOIN bills b ON pt.bill_id = b.id
        WHERE pt.unit_id = ?
        ORDER BY pt.created_at DESC
        LIMIT 20
      `, [unitId]);

      return res.status(200).json({
        bills,
        metrics: {
          totalInvoices: metrics.totalInvoices || 0,
          totalPaid: parseFloat(metrics.totalPaid || 0),
          pendingAmount: parseFloat(metrics.pendingAmount || 0),
          pendingCount: metrics.pendingCount || 0,
          overdueAmount: parseFloat(metrics.overdueAmount || 0),
          overdueCount: metrics.overdueCount || 0,
          outstandingAmount: parseFloat(metrics.pendingAmount || 0),
          nextDueDate: unpaidBills.length > 0 ? unpaidBills[0].due_date : null,
          nextDueBillId: unpaidBills.length > 0 ? unpaidBills[0].id : null,
          nextDueAmount: unpaidBills.length > 0 ? parseFloat(unpaidBills[0].amount) : 0,
        },
        transactions,
      });
    }
  } catch (error) {
    console.error('Get bills error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};


// @desc    Create a bill / invoice
// @route   POST /api/bills
// @access  Private (Admin / Staff)
const createBill = async (req, res) => {
  const { unit_id, amount, description, due_date, payment_method = 'Bank Transfer' } = req.body;

  try {
    if (!unit_id || !amount || !description || !due_date) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const [unit] = await pool.query('SELECT id FROM units WHERE id = ?', [unit_id]);
    if (unit.length === 0) {
      return res.status(404).json({ message: 'Unit not found.' });
    }

    const [result] = await pool.query(
      'INSERT INTO bills (unit_id, amount, description, due_date, status, payment_method) VALUES (?, ?, ?, ?, "unpaid", ?)',
      [unit_id, amount, description, due_date, payment_method]
    );

    // Generate invoice_id
    const invId = `INV-${String(result.insertId).padStart(4, '0')}`;
    await pool.query('UPDATE bills SET invoice_id = ? WHERE id = ?', [invId, result.insertId]);

    // Fetch unit & resident details to send email notification
    const [unitDetails] = await pool.query(`
      SELECT u.block_name, u.floor_number, u.unit_number,
             COALESCE(tenant.full_name, owner.full_name, MAX(u_user.full_name), tenant.email, owner.email, MAX(u_user.email)) AS resident_name,
             COALESCE(tenant.email, owner.email, MAX(u_user.email)) AS resident_email
      FROM units u
      LEFT JOIN users owner ON u.owner_id = owner.id
      LEFT JOIN users tenant ON u.tenant_id = tenant.id
      LEFT JOIN users u_user ON (u_user.unit_number = u.unit_number AND u_user.status = 'approved')
      WHERE u.id = ?
      GROUP BY u.id, u.block_name, u.floor_number, u.unit_number, tenant.full_name, owner.full_name, tenant.email, owner.email
      LIMIT 1
    `, [unit_id]);

    if (unitDetails.length > 0 && unitDetails[0].resident_email) {
      const uInfo = `${unitDetails[0].block_name} – Floor ${unitDetails[0].floor_number} – Unit ${unitDetails[0].unit_number}`;
      sendInvoiceEmail({
        email: unitDetails[0].resident_email,
        residentName: unitDetails[0].resident_name,
        invoiceId: invId,
        amount,
        description,
        dueDate: due_date,
        unitInfo: uInfo,
        paymentMethod: payment_method
      }).catch((err) => console.error('[Email] Invoice notification failed:', err.message));
    }

    return res.status(201).json({
      message: 'Invoice created successfully.',
      billId: result.insertId,
      invoiceId: invId
    });
  } catch (error) {
    console.error('Create bill error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Update bill status (admin mark as paid/unpaid)
// @route   PUT /api/bills/:id/status
// @access  Private (Admin / Staff)
const updateBillStatus = async (req, res) => {
  const { id } = req.params;
  const { status, payment_method = 'Bank Transfer', notes = '' } = req.body;

  try {
    const [bill] = await pool.query('SELECT * FROM bills WHERE id = ?', [id]);
    if (bill.length === 0) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    const targetBill = bill[0];

    const paidAt = status === 'paid' ? new Date() : null;
    await pool.query(
      'UPDATE bills SET status = ?, payment_method = ?, paid_at = ? WHERE id = ?',
      [status, payment_method, paidAt, id]
    );

    // Create a transaction record for paid bills
    if (status === 'paid') {
      const txId = `TRX-${Date.now().toString().slice(-6)}`;
      const [unit] = await pool.query('SELECT owner_id, tenant_id FROM units WHERE id = ?', [targetBill.unit_id]);
      const residentId = unit[0]?.owner_id || unit[0]?.tenant_id || req.user.id;

      await pool.query(`
        INSERT IGNORE INTO payment_transactions (transaction_id, bill_id, unit_id, user_id, amount, method, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, 'successful', ?)
      `, [txId, id, targetBill.unit_id, residentId, targetBill.amount, payment_method, notes]);
    }

    return res.status(200).json({ message: `Bill status updated to ${status}.` });
  } catch (error) {
    console.error('Update bill status error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Delete a bill
// @route   DELETE /api/bills/:id
// @access  Private (Admin / Staff)
const deleteBill = async (req, res) => {
  const { id } = req.params;
  try {
    const [bill] = await pool.query('SELECT id FROM bills WHERE id = ?', [id]);
    if (bill.length === 0) {
      return res.status(404).json({ message: 'Bill not found.' });
    }
    await pool.query('DELETE FROM payment_transactions WHERE bill_id = ?', [id]);
    await pool.query('DELETE FROM bills WHERE id = ?', [id]);
    return res.status(200).json({ message: 'Invoice deleted.' });
  } catch (error) {
    console.error('Delete bill error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Pay a bill (resident)
// @route   PUT /api/bills/:id/pay
// @access  Private (Homeowner / Tenant)
const payBill = async (req, res) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;
  const { payment_method = 'Online Payment' } = req.body;

  try {
    const [bill] = await pool.query('SELECT * FROM bills WHERE id = ?', [id]);
    if (bill.length === 0) return res.status(404).json({ message: 'Bill not found.' });

    const targetBill = bill[0];
    let unitQuery = role === 'homeowner' ? 'SELECT id FROM units WHERE owner_id = ?' : 'SELECT id FROM units WHERE tenant_id = ?';
    const [units] = await pool.query(unitQuery, [userId]);
    const unitId = units[0]?.id;

    if (!unitId || targetBill.unit_id !== unitId) {
      return res.status(403).json({ message: 'Permission denied.' });
    }

    if (targetBill.status === 'paid') {
      return res.status(400).json({ message: 'Bill is already paid.' });
    }

    await pool.query('UPDATE bills SET status = "paid", payment_method = ?, paid_at = NOW() WHERE id = ?', [payment_method, id]);

    const txId = `TRX-${Date.now().toString().slice(-6)}`;
    await pool.query(`
      INSERT IGNORE INTO payment_transactions (transaction_id, bill_id, unit_id, user_id, amount, method, status)
      VALUES (?, ?, ?, ?, ?, ?, 'successful')
    `, [txId, id, unitId, userId, targetBill.amount, payment_method]);

    return res.status(200).json({ message: 'Payment successful.' });
  } catch (error) {
    console.error('Pay bill error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get all payment transactions
// @route   GET /api/bills/transactions
// @access  Private (Admin / Staff)
const getTransactions = async (req, res) => {
  try {
    const [transactions] = await pool.query(`
      SELECT pt.*, 
             b.invoice_id, b.description,
             u.block_name, u.unit_number,
             COALESCE(res.full_name, own.full_name, 'N/A') AS resident_name
      FROM payment_transactions pt
      JOIN bills b ON pt.bill_id = b.id
      JOIN units u ON pt.unit_id = u.id
      LEFT JOIN users res ON u.tenant_id = res.id
      LEFT JOIN users own ON u.owner_id = own.id
      ORDER BY pt.created_at DESC
      LIMIT 20
    `);
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  createBill,
  getBills,
  payBill,
  updateBillStatus,
  deleteBill,
  getTransactions
};
