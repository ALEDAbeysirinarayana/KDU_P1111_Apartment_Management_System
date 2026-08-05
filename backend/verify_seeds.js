const mysql = require('mysql2/promise');
(async () => {
  const p = mysql.createPool({ host: 'localhost', user: 'root', password: 'Shashini1223@', database: 'apartment_management_system' });
  const [[f]]  = await p.query('SELECT COUNT(*) AS c FROM facilities');
  const [[fr]] = await p.query('SELECT COUNT(*) AS c FROM facility_reservations');
  const [[gp]] = await p.query("SELECT COUNT(*) AS c FROM parking_management WHERE type='guest' AND visitor_name IS NOT NULL");
  console.log('✅ Facilities:              ', f.c);
  console.log('✅ Facility Reservations:  ', fr.c);
  console.log('✅ Visitor Parking Requests:', gp.c);

  const [facs] = await p.query('SELECT facility_id, name, status, capacity FROM facilities ORDER BY facility_id');
  console.log('\n── Apartment Facilities ──');
  console.table(facs);

  const [frRows] = await p.query('SELECT id, facility_name, status, time_slot FROM facility_reservations ORDER BY id');
  console.log('── Facility Booking Requests ──');
  console.table(frRows);

  const [gpRows] = await p.query("SELECT slot_number, visitor_name, guest_date, status FROM parking_management WHERE type='guest' AND visitor_name IS NOT NULL ORDER BY id");
  console.log('── Visitor Parking Requests ──');
  console.table(gpRows);

  await p.end();
})();
