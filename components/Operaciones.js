import { useState } from 'react';

// Sample data - replace with real data source
const defaultEmployees = [
  { id: 1, name: 'Javier Sánchez-Marco', role: 'CEO / Comercial', costMonth: 4500, color: '#3182ce' },
  { id: 2, name: 'Borja', role: 'Operaciones', costMonth: 3200, color: '#38a169' },
  { id: 3, name: 'Analista 1', role: 'Analista', costMonth: 2800, color: '#d69e2e' },
  { id: 4, name: 'Analista 2', role: 'Analista', costMonth: 2800, color: '#e53e3e' },
];

const defaultClients = [
  { id: 1, name: 'CLIENTES ACTUALES (cartera dic 25)', mrr: 25870, assignedTo: 1 },
  { id: 2, name: 'SEAYA + BEJO', mrr: 3855, assignedTo: 1 },
  { id: 3, name: 'PERRY SL', mrr: 2115, assignedTo: 2 },
  { id: 4, name: 'TERRALPA INVESTMENT', mrr: 2200, assignedTo: 1 },
  { id: 5, name: 'GRUPO MOVILIA', mrr: 1520, assignedTo: 2 },
  { id: 6, name: 'SEAYA OTRAS', mrr: 1350, assignedTo: 1 },
  { id: 7, name: 'MEDSUM NUEVAS', mrr: 700, assignedTo: 3 },
  { id: 8, name: 'PROYECTO LIMPIO', mrr: 1500, assignedTo: 3 },
  { id: 9, name: 'FARADAY', mrr: 1000, assignedTo: 4 },
  { id: 10, name: 'IVAN MAURA - GIMNASIOS', mrr: 800, assignedTo: 4 },
];

const COLORS = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5', '#dd6b20', '#319795', '#d53f8c'];

function fmt(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function EmployeeCard({ employee, clients, onReassign, allEmployees, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: employee.name, role: employee.role, costMonth: employee.costMonth });
  const totalMRR = clients.reduce((sum, c) => sum + c.mrr, 0);
  const annualRevenue = totalMRR * 12;
  const annualCost = employee.costMonth * 14;
  const ratio = annualCost > 0 ? (annualRevenue / annualCost).toFixed(1) : 0;
  const margin = annualRevenue - annualCost;

  function handleSaveEdit() {
    onEdit(employee.id, { name: editData.name, role: editData.role, costMonth: parseFloat(editData.costMonth) || 0 });
    setEditing(false);
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} style={inputStyle} placeholder="Nombre" />
              <input value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })} style={inputStyle} placeholder="Rol" />
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" value={editData.costMonth} onChange={e => setEditData({ ...editData, costMonth: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="Coste/mes" />
                <button onClick={handleSaveEdit} style={{ ...btnStyle, padding: '6px 12px', fontSize: 12 }}>Guardar</button>
                <button onClick={() => setEditing(false)} style={{ ...btnStyle, padding: '6px 12px', fontSize: 12, background: '#718096' }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: employee.color }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a365d' }}>{employee.name}</h3>
              </div>
              <p style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>{employee.role}</p>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: parseFloat(ratio) >= 3 ? '#f0fff4' : parseFloat(ratio) >= 2 ? '#fffff0' : '#fff5f5',
            color: parseFloat(ratio) >= 3 ? '#38a169' : parseFloat(ratio) >= 2 ? '#d69e2e' : '#e53e3e',
            padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700,
          }}>{ratio}x</div>
          {!editing && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => { setEditData({ name: employee.name, role: employee.role, costMonth: employee.costMonth }); setEditing(true); }}
                style={iconBtnStyle} title="Editar">✏️</button>
              <button onClick={() => { if (confirm(`¿Eliminar a ${employee.name}? Los clientes asignados quedarán sin asignar.`)) onDelete(employee.id); }}
                style={iconBtnStyle} title="Eliminar">🗑️</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={miniLabel}>Facturación /mes</div>
          <div style={miniValue}>{fmt(totalMRR)}</div>
        </div>
        <div>
          <div style={miniLabel}>Coste empresa /mes</div>
          <div style={miniValue}>{fmt(employee.costMonth)}</div>
        </div>
        <div>
          <div style={miniLabel}>Margen /año</div>
          <div style={{ ...miniValue, color: margin >= 0 ? '#38a169' : '#e53e3e' }}>{fmt(margin)}</div>
        </div>
        <div>
          <div style={miniLabel}>Nº Clientes</div>
          <div style={miniValue}>{clients.length}</div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #edf2f7', paddingTop: 12 }}>
        <div style={{ ...miniLabel, marginBottom: 8 }}>Clientes asignados ({clients.length})</div>
        {clients.map(client => (
          <div key={client.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 0', borderBottom: '1px solid #f7fafc',
          }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{client.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#3182ce', fontWeight: 600 }}>{fmt(client.mrr)}/mes</span>
              <select value={client.assignedTo}
                onChange={(e) => onReassign(client.id, parseInt(e.target.value))}
                style={selectStyle}>
                {allEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name.split(' ')[0]}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <p style={{ fontSize: 12, color: '#a0aec0', fontStyle: 'italic' }}>Sin clientes asignados</p>
        )}
      </div>
    </div>
  );
}

export default function Operaciones() {
  const [employees, setEmployees] = useState(defaultEmployees);
  const [clients, setClients] = useState(defaultClients);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', mrr: '', assignedTo: 1 });
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', costMonth: '' });

  function handleReassign(clientId, newEmployeeId) {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, assignedTo: newEmployeeId } : c));
  }

  function handleAddClient() {
    if (!newClient.name || !newClient.mrr) return;
    setClients(prev => [...prev, {
      id: Date.now(),
      name: newClient.name.toUpperCase(),
      mrr: parseFloat(newClient.mrr),
      assignedTo: newClient.assignedTo || employees[0]?.id || 1,
    }]);
    setNewClient({ name: '', mrr: '', assignedTo: employees[0]?.id || 1 });
    setShowAddClient(false);
  }

  function handleDeleteClient(clientId) {
    setClients(prev => prev.filter(c => c.id !== clientId));
  }

  function handleAddEmployee() {
    if (!newEmployee.name) return;
    const id = Date.now();
    const colorIdx = employees.length % COLORS.length;
    setEmployees(prev => [...prev, {
      id,
      name: newEmployee.name,
      role: newEmployee.role || 'Sin rol',
      costMonth: parseFloat(newEmployee.costMonth) || 0,
      color: COLORS[colorIdx],
    }]);
    setNewEmployee({ name: '', role: '', costMonth: '' });
    setShowAddEmployee(false);
  }

  function handleDeleteEmployee(empId) {
    setEmployees(prev => prev.filter(e => e.id !== empId));
    // Unassign clients from deleted employee
    setClients(prev => prev.map(c => c.assignedTo === empId ? { ...c, assignedTo: employees[0]?.id || 0 } : c));
  }

  function handleEditEmployee(empId, updates) {
    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, ...updates } : e));
  }

  const totalMRR = clients.reduce((s, c) => s + c.mrr, 0);
  const totalCost = employees.reduce((s, e) => s + e.costMonth, 0);
  const overallRatio = totalCost > 0 ? ((totalMRR * 12) / (totalCost * 14)).toFixed(1) : 0;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={summaryCard}>
          <span style={miniLabel}>MRR Total Asignado</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#1a365d' }}>{fmt(totalMRR)}</span>
        </div>
        <div style={summaryCard}>
          <span style={miniLabel}>Coste Total Equipo /mes</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#1a365d' }}>{fmt(totalCost)}</span>
        </div>
        <div style={summaryCard}>
          <span style={miniLabel}>Ratio Facturación/Coste</span>
          <span style={{
            fontSize: 24, fontWeight: 700,
            color: parseFloat(overallRatio) >= 3 ? '#38a169' : parseFloat(overallRatio) >= 2 ? '#d69e2e' : '#e53e3e',
          }}>{overallRatio}x</span>
        </div>
        <div style={summaryCard}>
          <span style={miniLabel}>Clientes Totales</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#1a365d' }}>{clients.length}</span>
        </div>
        <div style={{ ...summaryCard, cursor: 'pointer', background: showAddClient ? '#edf2f7' : '#fff' }}
          onClick={() => { setShowAddClient(!showAddClient); setShowAddEmployee(false); }}>
          <span style={miniLabel}>Acción</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#3182ce' }}>+ Añadir cliente</span>
        </div>
        <div style={{ ...summaryCard, cursor: 'pointer', background: showAddEmployee ? '#edf2f7' : '#fff' }}
          onClick={() => { setShowAddEmployee(!showAddEmployee); setShowAddClient(false); }}>
          <span style={miniLabel}>Acción</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#38a169' }}>+ Añadir empleado</span>
        </div>
      </div>

      {/* Add client form */}
      {showAddClient && (
        <div style={{ ...cardStyle, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 200px' }}>
            <label style={miniLabel}>Nombre cliente</label>
            <input value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="EMPRESA S.L." style={inputStyle} />
          </div>
          <div style={{ flex: '1 1 100px' }}>
            <label style={miniLabel}>MRR (€)</label>
            <input type="number" value={newClient.mrr} onChange={e => setNewClient({ ...newClient, mrr: e.target.value })} placeholder="1500" style={inputStyle} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={miniLabel}>Asignar a</label>
            <select value={newClient.assignedTo} onChange={e => setNewClient({ ...newClient, assignedTo: parseInt(e.target.value) })}
              style={{ ...inputStyle, appearance: 'auto' }}>
              {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
            </select>
          </div>
          <button onClick={handleAddClient} style={btnStyle}>Añadir</button>
        </div>
      )}

      {/* Add employee form */}
      {showAddEmployee && (
        <div style={{ ...cardStyle, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 200px' }}>
            <label style={miniLabel}>Nombre empleado</label>
            <input value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} placeholder="Nombre completo" style={inputStyle} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={miniLabel}>Rol</label>
            <input value={newEmployee.role} onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })} placeholder="Ej: Analista" style={inputStyle} />
          </div>
          <div style={{ flex: '1 1 100px' }}>
            <label style={miniLabel}>Coste empresa /mes (€)</label>
            <input type="number" value={newEmployee.costMonth} onChange={e => setNewEmployee({ ...newEmployee, costMonth: e.target.value })} placeholder="2800" style={inputStyle} />
          </div>
          <button onClick={handleAddEmployee} style={{ ...btnStyle, background: '#38a169' }}>Añadir empleado</button>
        </div>
      )}

      {/* Employee cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {employees.map(emp => (
          <EmployeeCard key={emp.id} employee={emp}
            clients={clients.filter(c => c.assignedTo === emp.id)}
            onReassign={handleReassign}
            allEmployees={employees}
            onDelete={handleDeleteEmployee}
            onEdit={handleEditEmployee}
          />
        ))}
      </div>

      <p style={{ fontSize: 11, color: '#a0aec0', marginTop: 20 }}>
        * Los datos de empleados y asignaciones son editables. Los cambios se guardan en la sesión actual.
      </p>
    </div>
  );
}

const cardStyle = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' };
const summaryCard = { background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 4 };
const miniLabel = { fontSize: 11, color: '#718096', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.3 };
const miniValue = { fontSize: 16, fontWeight: 600, color: '#1a365d' };
const selectStyle = { padding: '2px 4px', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 11, color: '#718096', background: '#f7fafc', cursor: 'pointer', fontFamily: 'inherit' };
const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', marginTop: 4 };
const btnStyle = { padding: '8px 20px', background: '#1a365d', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
const iconBtnStyle = { background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', fontSize: 14, lineHeight: 1 };
