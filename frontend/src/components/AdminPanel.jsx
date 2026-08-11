import { useState, useEffect } from 'react';
import api from '../api';
import { Trash2, Edit2, ShieldAlert, Check, X, Shield, Eye, Sparkles } from 'lucide-react';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editEmail, setEditEmail] = useState('');
    const [editRole, setEditRole] = useState('');
    const [viewingUserTasks, setViewingUserTasks] = useState(null);
    const [userTasks, setUserTasks] = useState([]);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id, email) => {
        if (confirm(`CRITICAL WARNING: Are you sure you want to delete user ${email}? This will permanently delete ALL their tasks and cryptographic audit logs.`)) {
            try {
                await api.delete(`/admin/users/${id}`);
                fetchUsers();
            } catch (err) {
                console.error('Failed to delete user', err);
                alert('Failed to delete user');
            }
        }
    };

    const handleEdit = (user) => {
        setEditingUserId(user.id);
        setEditEmail(user.email);
        setEditRole(user.role);
    };

    const handleSave = async (id) => {
        try {
            await api.put(`/admin/users/${id}`, { email: editEmail, role: editRole });
            setEditingUserId(null);
            fetchUsers();
        } catch (err) {
            console.error('Failed to update user', err);
            alert('Failed to update user');
        }
    };

    const handleViewTasks = async (user) => {
        try {
            const res = await api.get(`/admin/users/${user.id}/tasks`);
            setUserTasks(res.data);
            setViewingUserTasks(user);
        } catch (err) {
            console.error('Failed to fetch user tasks', err);
            alert('Failed to fetch user tasks');
        }
    };

    const fetchAuditLogs = async (id) => {
        try {
            const res = await api.get(`/tasks/${id}/audit`);
            setAuditLogs(res.data);
            setShowAuditModal(true);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        }
    };

    if (isLoading) return <div className="text-center py-10">Loading Admin Panel...</div>;

    return (
        <>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 flex items-center bg-gray-50/50">
                <ShieldAlert className="w-6 h-6 text-red-500 mr-2" />
                <h3 className="text-xl font-black text-gray-800">User Management</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Created At</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs">{user.id}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {editingUserId === user.id ? (
                                        <input 
                                            type="email" 
                                            value={editEmail} 
                                            onChange={e => setEditEmail(e.target.value)} 
                                            className="border rounded px-2 py-1 w-full max-w-[200px]"
                                        />
                                    ) : user.email}
                                </td>
                                <td className="px-6 py-4">
                                    {editingUserId === user.id ? (
                                        <select 
                                            value={editRole} 
                                            onChange={e => setEditRole(e.target.value)}
                                            className="border rounded px-2 py-1"
                                        >
                                            <option value="ROLE_USER">USER</option>
                                            <option value="ROLE_ADMIN">ADMIN</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.role === 'ROLE_ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {user.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {editingUserId === user.id ? (
                                        <>
                                            <button onClick={() => handleSave(user.id)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"><Check size={16}/></button>
                                            <button onClick={() => setEditingUserId(null)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><X size={16}/></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => handleViewTasks(user)} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors" title="View Tasks"><Eye size={16}/></button>
                                            <button onClick={() => handleEdit(user)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDelete(user.id, user.email)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
            {viewingUserTasks && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[85vh] overflow-y-auto border border-gray-100">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                            <h3 className="text-xl font-black bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent flex items-center">
                                <Eye className="w-6 h-6 text-purple-500 mr-2" />
                                Tasks for {viewingUserTasks.email}
                            </h3>
                            <button onClick={() => setViewingUserTasks(null)} className="text-gray-400 hover:text-gray-800 font-bold bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors">×</button>
                        </div>
                        {userTasks.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-gray-500 font-medium">This user has no tasks yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {userTasks.map(task => (
                                    <div key={task.id} className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-1">{task.title}</h4>
                                            <p className="text-xs text-gray-500 max-w-md">{task.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end space-y-2">
                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
                                                task.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                                                task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
                                                task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                task.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {task.priority} Priority
                                            </span>
                                            <button onClick={() => fetchAuditLogs(task.id)} className="mt-1 p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="View Blockchain Audit Log"><Sparkles size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {showAuditModal && (
                <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[85vh] overflow-y-auto border border-gray-100">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                            <h3 className="text-xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent flex items-center">
                                <Sparkles className="w-6 h-6 text-emerald-500 mr-2" />
                                Cryptographic Audit Ledger
                            </h3>
                            <button onClick={() => setShowAuditModal(false)} className="text-gray-400 hover:text-gray-800 font-bold bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors">×</button>
                        </div>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {auditLogs.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="inline-block p-4 rounded-full bg-gray-50 mb-3">
                                        <Sparkles className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium">No cryptographic records found yet.</p>
                                </div>
                            ) : auditLogs.map((log, idx) => (
                                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full shadow-sm ${log.action === 'CREATED' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : log.action === 'UPDATED' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'}`}>
                                                {log.action}
                                            </span>
                                            <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl mb-2">
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Block Hash</div>
                                            <div className="text-xs text-gray-700 font-mono break-all">{log.hash}</div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Previous Link</div>
                                            <div className="text-xs text-gray-500 font-mono break-all">{log.previousHash}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPanel;
