const pool = require('../config/db');

// @desc    Get all units with owner, tenant, and parking details
// @route   GET /api/units
// @access  Private (Admin / Staff)
const getUnits = async (req, res) => {
  try {
    const { block, floor, status, type, search } = req.query;
    
    let conditions = [];
    let params = [];

    if (block && block !== 'All' && block !== 'All Blocks') {
      conditions.push('u.block_name = ?');
      params.push(block);
    }

    if (floor && floor !== 'All' && floor !== 'All Floors') {
      conditions.push('u.floor_number = ?');
      params.push(parseInt(floor));
    }

    if (status && status !== 'All' && status !== 'Status') {
      conditions.push('u.status = ?');
      params.push(status.toLowerCase());
    }

    if (type && type !== 'All' && type !== 'Unit Type') {
      conditions.push('u.type = ?');
      params.push(type);
    }

    if (search && search.trim() !== '') {
      conditions.push('(u.unit_number LIKE ? OR u.block_name LIKE ? OR owner.full_name LIKE ? OR owner.email LIKE ? OR tenant.full_name LIKE ? OR tenant.email LIKE ? OR u_user.full_name LIKE ? OR u_user.email LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [units] = await pool.query(`
      SELECT 
        u.id, u.block_name, u.floor_number, u.unit_number, u.type, u.status,
        u.owner_id,
        owner.email AS owner_email,
        COALESCE(owner.full_name, owner.email) AS owner_name,
        u.tenant_id,
        tenant.email AS tenant_email,
        COALESCE(tenant.full_name, tenant.email) AS tenant_name,
        u.parking_slot_id, p.slot_number AS parking_slot_number,
        COALESCE(tenant.full_name, tenant.email, owner.full_name, owner.email, MAX(u_user.full_name), MAX(u_user.email), 'Resident') AS resident_name,
        COALESCE(tenant.email, owner.email, MAX(u_user.email), NULL) AS resident_email,
        CASE 
          WHEN tenant.id IS NOT NULL THEN 'Tenant'
          WHEN owner.id IS NOT NULL THEN 'Homeowner'
          WHEN MAX(u_user.id) IS NOT NULL THEN CONCAT(UCASE(LEFT(MAX(u_user.role), 1)), LCASE(SUBSTRING(MAX(u_user.role), 2)))
          ELSE 'Vacant'
        END AS resident_role
      FROM units u
      LEFT JOIN users owner ON u.owner_id = owner.id
      LEFT JOIN users tenant ON u.tenant_id = tenant.id
      LEFT JOIN users u_user ON (u_user.unit_number = u.unit_number AND u_user.status = 'approved')
      LEFT JOIN parking_management p ON u.parking_slot_id = p.id
      ${whereClause}
      GROUP BY u.id, u.block_name, u.floor_number, u.unit_number, u.type, u.status,
               u.owner_id, owner.email, owner.full_name,
               u.tenant_id, tenant.email, tenant.full_name,
               u.parking_slot_id, p.slot_number
      ORDER BY u.block_name, u.floor_number, u.unit_number
    `, params);

    // Calculate unit metrics
    const [[unitMetrics]] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS occupied,
        SUM(CASE WHEN status = 'vacant' THEN 1 ELSE 0 END) AS vacant,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) AS maintenance
      FROM units
    `);

    // Calculate parking metrics
    const [[parkingMetrics]] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN unit_id IS NULL AND status IN ('active', 'approved') THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN unit_id IS NOT NULL THEN 1 ELSE 0 END) AS assigned
      FROM parking_management
    `);

    // Dynamic metrics payload
    const metrics = {
      totalUnits: unitMetrics.total || 0,
      occupiedUnits: unitMetrics.occupied || 0,
      vacantUnits: unitMetrics.vacant || 0,
      maintenanceUnits: unitMetrics.maintenance || 0,
      totalParking: parkingMetrics.total || 550,
      availableParking: parkingMetrics.available || 82,
      assignedParking: parkingMetrics.assigned || 468,
      storageUnits: 120 // Static mock count as per mockup spec
    };

    return res.status(200).json({
      units,
      metrics
    });
  } catch (error) {
    console.error('Get units error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Create a new unit
// @route   POST /api/units
// @access  Private (Admin / Staff)
const createUnit = async (req, res) => {
  const { block_name, floor_number, unit_number, type = '2BHK', status = 'vacant' } = req.body;

  try {
    if (!block_name || !floor_number || !unit_number) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if unit already exists
    const [existing] = await pool.query(
      'SELECT id FROM units WHERE block_name = ? AND floor_number = ? AND unit_number = ?',
      [block_name, floor_number, unit_number]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'A unit with this block, floor, and number already exists.' });
    }

    const [result] = await pool.query(
      'INSERT INTO units (block_name, floor_number, unit_number, type, status) VALUES (?, ?, ?, ?, ?)',
      [block_name, floor_number, unit_number, type, status]
    );

    return res.status(201).json({
      message: 'Unit created successfully.',
      unitId: result.insertId
    });
  } catch (error) {
    console.error('Create unit error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Allocate owner, tenant, and parking slot to a unit
// @route   PUT /api/units/:id
// @access  Private (Admin / Staff)
const allocateUnit = async (req, res) => {
  const { id } = req.params;
  const { owner_id, tenant_id, parking_slot_id } = req.body;

  try {
    // 1. Verify unit exists
    const [unitExists] = await pool.query('SELECT * FROM units WHERE id = ?', [id]);
    if (unitExists.length === 0) {
      return res.status(404).json({ message: 'Unit not found.' });
    }

    // 2. Validate homeowner if provided
    if (owner_id) {
      const [owner] = await pool.query('SELECT role, status FROM users WHERE id = ?', [owner_id]);
      if (owner.length === 0 || owner[0].role !== 'homeowner' || owner[0].status !== 'approved') {
        return res.status(400).json({ message: 'Selected owner must be an approved homeowner.' });
      }
    }

    // 3. Validate tenant if provided
    if (tenant_id) {
      const [tenant] = await pool.query('SELECT role, status FROM users WHERE id = ?', [tenant_id]);
      if (tenant.length === 0 || tenant[0].role !== 'tenant' || tenant[0].status !== 'approved') {
        return res.status(400).json({ message: 'Selected tenant must be an approved tenant.' });
      }
    }

    // 4. Validate parking slot if provided
    if (parking_slot_id) {
      const [slot] = await pool.query('SELECT id, unit_id FROM parking_management WHERE id = ?', [parking_slot_id]);
      if (slot.length === 0) {
        return res.status(400).json({ message: 'Selected parking slot does not exist.' });
      }
      // If slot is already assigned to a different unit, reject
      if (slot[0].unit_id && slot[0].unit_id !== parseInt(id)) {
        return res.status(400).json({ message: 'Selected parking slot is already allocated to another unit.' });
      }
    }

    // 5. Update unit
    const prevOwnerId = unitExists[0].owner_id;
    const prevTenantId = unitExists[0].tenant_id;
    const blockName = unitExists[0].block_name;
    const unitNumber = unitExists[0].unit_number;

    const finalOwnerId = owner_id || null;
    const finalTenantId = tenant_id || null;
    const finalParkingSlotId = parking_slot_id || null;

    let finalStatus = 'vacant';
    if (finalOwnerId || finalTenantId) {
      finalStatus = 'occupied';
    }

    await pool.query(
      'UPDATE units SET owner_id = ?, tenant_id = ?, parking_slot_id = ?, status = ? WHERE id = ?',
      [finalOwnerId, finalTenantId, finalParkingSlotId, finalStatus, id]
    );

    // 6. Update tenant's owner_id in the users table to keep integrity
    if (finalTenantId && finalOwnerId) {
      await pool.query('UPDATE users SET owner_id = ? WHERE id = ?', [finalOwnerId, finalTenantId]);
    }

    // 7. Sync newly assigned owner's building_name and unit_number in users table
    if (finalOwnerId) {
      await pool.query('UPDATE users SET building_name = ?, unit_number = ? WHERE id = ?', [blockName, unitNumber, finalOwnerId]);
    }

    // 8. Sync newly assigned tenant's building_name and unit_number in users table
    if (finalTenantId) {
      await pool.query('UPDATE users SET building_name = ?, unit_number = ? WHERE id = ?', [blockName, unitNumber, finalTenantId]);
    }

    // 9. If previous owner was unassigned or replaced, update old owner's record
    if (prevOwnerId && prevOwnerId !== finalOwnerId) {
      const [otherUnit] = await pool.query('SELECT block_name, unit_number FROM units WHERE (owner_id = ? OR tenant_id = ?) AND id != ? LIMIT 1', [prevOwnerId, prevOwnerId, id]);
      if (otherUnit.length > 0) {
        await pool.query('UPDATE users SET building_name = ?, unit_number = ? WHERE id = ?', [otherUnit[0].block_name, otherUnit[0].unit_number, prevOwnerId]);
      } else {
        await pool.query('UPDATE users SET building_name = NULL, unit_number = NULL WHERE id = ?', [prevOwnerId]);
      }
    }

    // 10. If previous tenant was unassigned or replaced, update old tenant's record
    if (prevTenantId && prevTenantId !== finalTenantId) {
      const [otherUnit] = await pool.query('SELECT block_name, unit_number FROM units WHERE (owner_id = ? OR tenant_id = ?) AND id != ? LIMIT 1', [prevTenantId, prevTenantId, id]);
      if (otherUnit.length > 0) {
        await pool.query('UPDATE users SET building_name = ?, unit_number = ? WHERE id = ?', [otherUnit[0].block_name, otherUnit[0].unit_number, prevTenantId]);
      } else {
        await pool.query('UPDATE users SET building_name = NULL, unit_number = NULL WHERE id = ?', [prevTenantId]);
      }
    }

    // 11. Update parking_management slot link
    // First, clear old parking slot association for this unit
    await pool.query('UPDATE parking_management SET unit_id = NULL WHERE unit_id = ? AND type = "permanent"', [id]);
    
    // Set new parking slot association
    if (finalParkingSlotId) {
      await pool.query('UPDATE parking_management SET unit_id = ? WHERE id = ?', [id, finalParkingSlotId]);
    }

    return res.status(200).json({ message: 'Unit allocations updated successfully.' });
  } catch (error) {
    console.error('Allocate unit error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// @desc    Get unit details for logged-in resident (Homeowner or Tenant)
// @route   GET /api/units/my-unit
// @access  Private (Homeowner / Tenant)
const getMyUnit = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    let query = '';
    let params = [];

    if (role === 'homeowner') {
      query = `
        SELECT u.*, p.slot_number AS parking_slot_number, tenant.email AS tenant_email
        FROM units u
        LEFT JOIN parking_management p ON u.parking_slot_id = p.id
        LEFT JOIN users tenant ON u.tenant_id = tenant.id
        WHERE u.owner_id = ?
      `;
      params = [userId];
    } else if (role === 'tenant') {
      query = `
        SELECT u.*, p.slot_number AS parking_slot_number, owner.email AS owner_email
        FROM units u
        LEFT JOIN parking_management p ON u.parking_slot_id = p.id
        LEFT JOIN users owner ON u.owner_id = owner.id
        WHERE u.tenant_id = ?
      `;
      params = [userId];
    } else {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const [units] = await pool.query(query, params);
    if (units.length === 0) {
      return res.status(404).json({ message: 'No unit associated with your account yet.' });
    }

    return res.status(200).json(units[0]);
  } catch (error) {
    console.error('Get my unit error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Automatically sync unit allocation data into users table
pool.query(`
  UPDATE users u
  JOIN units un ON (un.owner_id = u.id OR un.tenant_id = u.id)
  SET u.building_name = un.block_name, u.unit_number = un.unit_number
`).catch((err) => console.error('Initial user-unit sync error:', err.message));

module.exports = {
  getUnits,
  createUnit,
  allocateUnit,
  getMyUnit,
  searchResidentUsers
};

// @desc    Search approved homeowners and tenants by name or email
// @route   GET /api/units/resident-users?search=&role=
// @access  Private (Admin / Staff)
async function searchResidentUsers(req, res) {
  try {
    const { search = '', role = '' } = req.query;
    const searchPattern = `%${search.trim()}%`;

    let roleCondition = "u.role IN ('homeowner', 'tenant')";
    if (role === 'homeowner') roleCondition = "u.role = 'homeowner'";
    if (role === 'tenant')    roleCondition = "u.role = 'tenant'";

    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role
       FROM users u
       WHERE ${roleCondition}
         AND u.status = 'approved'
         AND (u.full_name LIKE ? OR u.email LIKE ?)
       ORDER BY u.full_name ASC
       LIMIT 30`,
      [searchPattern, searchPattern]
    );

    return res.status(200).json(users);
  } catch (error) {
    console.error('Search resident users error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

