import { useState, useEffect } from 'react';
import api from '../api';
import { Trash2, Edit2, ShieldAlert, Check, X, Shield, Eye } from 'lucide-react';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editEmail, setEditEmail] = useState('');
    const [editRole, setEditRole] = useState('');
    const [viewingUserTasks, setViewingUserTasks] = useState(null);
    const [userTasks, setUserTasks] = useState([]);

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
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPanel;
