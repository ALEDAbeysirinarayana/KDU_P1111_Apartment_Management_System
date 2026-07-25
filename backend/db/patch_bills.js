const pool = require('../config/db');

async function runPatch() {
  console.log('Patching bills table and creating transactions table...');
  try {
    // Add invoice_id column to bills
    const billsCols = [
      { name: 'invoice_id', def: 'VARCHAR(50) NULL UNIQUE' },
      { name: 'payment_method', def: "VARCHAR(50) DEFAULT 'Bank Transfer'" },
      { name: 'paid_at', def: 'TIMESTAMP NULL' }
    ];

    for (const col of billsCols) {
      const [existing] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bills' AND COLUMN_NAME = ?`,
        [col.name]
      );
      if (existing.length === 0) {
        await pool.query(`ALTER TABLE bills ADD COLUMN \`${col.name}\` ${col.def}`);
        console.log(`Added column bills.${col.name}`);
      } else {
        console.log(`Column bills.${col.name} already exists`);
      }
    }

    // Create payment_transactions table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id VARCHAR(50) NOT NULL UNIQUE,
        bill_id INT NOT NULL,
        unit_id INT NOT NULL,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        method ENUM('Bank Transfer', 'Online Payment', 'Card', 'Cash') DEFAULT 'Bank Transfer',
        status ENUM('successful', 'pending', 'failed') DEFAULT 'successful',
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('payment_transactions table ready.');

    // Generate INV-XXXX IDs for existing bills that don't have one
    const [billsWithoutId] = await pool.query('SELECT id FROM bills WHERE invoice_id IS NULL');
    for (const bill of billsWithoutId) {
      const invId = `INV-${String(bill.id).padStart(4, '0')}`;
      await pool.query('UPDATE bills SET invoice_id = ? WHERE id = ?', [invId, bill.id]);
    }
    console.log(`Assigned invoice IDs to ${billsWithoutId.length} bills.`);

    // Seed some sample transactions for paid bills
    const [txCount] = await pool.query('SELECT COUNT(*) AS count FROM payment_transactions');
    if (txCount[0].count === 0) {
      const [paidBills] = await pool.query(`
        SELECT b.id AS bill_id, b.unit_id, b.amount, b.invoice_id, u.owner_id, u.tenant_id
        FROM bills b
        JOIN units u ON b.unit_id = u.id
        WHERE b.status = 'paid'
        LIMIT 5
      `);
      
      for (let i = 0; i < paidBills.length; i++) {
        const bill = paidBills[i];
        const userId = bill.owner_id || bill.tenant_id || 1;
        const methods = ['Bank Transfer', 'Online Payment', 'Card', 'Cash'];
        const method = methods[i % methods.length];
        const txId = `TRX-${String(99010 + i).padStart(5, '0')}`;
        
        await pool.query(`
          INSERT IGNORE INTO payment_transactions (transaction_id, bill_id, unit_id, user_id, amount, method, status)
          VALUES (?, ?, ?, ?, ?, ?, 'successful')
        `, [txId, bill.bill_id, bill.unit_id, userId, bill.amount, method]);
      }
      console.log(`Seeded ${paidBills.length} sample transactions.`);
    }

    console.log('Bills patch completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Patch failed:', error);
    process.exit(1);
  }
}

runPatch();
