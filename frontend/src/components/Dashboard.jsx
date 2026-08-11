import { useState, useEffect } from 'react';
import api from '../api';
import { LogOut, Plus, Sparkles, Trash2, Edit2, Users, LayoutDashboard } from 'lucide-react';
import AdminPanel from './AdminPanel';

const Dashboard = ({ setAuth }) => {
    const [tasks, setTasks] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const size = 10;
    const [showModal, setShowModal] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const isAdmin = localStorage.getItem('role') === 'ROLE_ADMIN';
    const [currentTask, setCurrentTask] = useState({
        title: '', description: '', priority: 'MEDIUM', dueDate: '', status: 'TODO'
    });

    useEffect(() => {
        fetchTasks();
    }, [page, search, statusFilter]);

    const fetchTasks = async () => {
        try {
            const params = new URLSearchParams({ page, size });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            const res = await api.get(`/tasks?${params.toString()}`);
            setTasks(res.data.content);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error('Failed to fetch tasks', err);
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        setAuth(false);
    };

    const handleGenerateAI = async () => {
        if (!currentTask.title) return alert('Please enter a title first');
        setIsGenerating(true);
        try {
            const res = await api.post('/tasks/generate-details', { title: currentTask.title });
            setCurrentTask(prev => ({
                ...prev,
                description: res.data.description || prev.description,
                priority: res.data.priority || prev.priority
            }));
        } catch (err) {
            console.error('AI generation failed', err);
        }
        setIsGenerating(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentTask.id) {
                await api.put(`/tasks/${currentTask.id}`, currentTask);
            } else {
                await api.post('/tasks', currentTask);
            }
            setShowModal(false);
            setCurrentTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '', status: 'TODO' });
            fetchTasks();
        } catch (err) {
            console.error('Failed to save task', err);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure?')) {
            await api.delete(`/tasks/${id}`);
            fetchTasks();
        }
    };

    const updateStatus = async (task, newStatus) => {
        try {
            await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
            fetchTasks();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const getColumnColor = (status) => {
        switch(status) {
            case 'TODO': return 'from-blue-50 to-indigo-50 border-blue-100';
            case 'IN_PROGRESS': return 'from-amber-50 to-orange-50 border-amber-100';
            case 'DONE': return 'from-emerald-50 to-teal-50 border-emerald-100';
            default: return 'from-gray-50 to-gray-100';
        }
    };

    const getColumnHeaderColor = (status) => {
        switch(status) {
            case 'TODO': return 'text-blue-800 bg-blue-100/50';
            case 'IN_PROGRESS': return 'text-amber-800 bg-amber-100/50';
            case 'DONE': return 'text-emerald-800 bg-emerald-100/50';
            default: return 'text-gray-800';
        }
    };

    const TaskColumn = ({ title, status, columnTasks }) => (
        <div className={`flex-1 rounded-2xl p-5 shadow-sm min-h-[500px] bg-gradient-to-b border ${getColumnColor(status)}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className={`font-bold px-4 py-2 rounded-lg text-sm uppercase tracking-wider ${getColumnHeaderColor(status)}`}>
                    {title}
                </h3>
                <span className="bg-white/60 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {columnTasks.length}
                </span>
            </div>
            <div className="space-y-4">
                {columnTasks.map(task => (
                    <div key={task.id} className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-white/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">{task.title}</h4>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full shadow-sm ${task.priority === 'HIGH' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white' : task.priority === 'MEDIUM' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white'}`}>
                                {task.priority}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-5 line-clamp-3 leading-relaxed">{task.description}</p>
                        <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100/80">
                            <select 
                                value={task.status} 
                                onChange={(e) => updateStatus(task, e.target.value)}
                                className="bg-gray-50 border-none text-gray-600 text-xs font-medium rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 shadow-inner cursor-pointer"
                            >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                            </select>
                            <div className="flex space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                {localStorage.getItem('role') === 'ROLE_ADMIN' && (
                                    <button onClick={() => fetchAuditLogs(task.id)} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="View Blockchain Audit Log"><Sparkles size={16} /></button>
                                )}
                                <button onClick={() => { setCurrentTask(task); setShowModal(true); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(task.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                            <Sparkles className="w-5 h-5 text-blue-500 mr-2" />
                            Task manager
                            {localStorage.getItem('role') === 'ROLE_ADMIN' && (
                                <span className="ml-3 text-[10px] bg-red-100 border border-red-200 text-red-700 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm">Admin</span>
                            )}
                        </h1>
                        <div className="flex items-center space-x-4">
                            <button onClick={handleLogout} className="flex items-center text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors px-4 py-2 rounded-lg hover:bg-red-50">
                                <LogOut className="w-4 h-4 mr-2" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isAdmin ? (
                    <AdminPanel />
                ) : (
                    <>
                        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Mission Control</h2>
                                <p className="text-gray-500 mt-1 text-sm font-medium">Manage your tasks with AI and Blockchain</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                <input 
                                    type="text" 
                                    placeholder="Search tasks..." 
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                    className="w-full sm:w-64 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2.5 text-sm transition-all shadow-sm"
                                />
                                <select 
                                    value={statusFilter} 
                                    onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                                    className="w-full sm:w-auto rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2.5 text-sm transition-all shadow-sm font-semibold text-gray-600"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                </select>
                                <button onClick={() => { setCurrentTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '', status: 'TODO' }); setShowModal(true); }} className="w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 whitespace-nowrap">
                                    <Plus className="w-5 h-5 mr-1" /> New Task
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6 mb-8">
                            <TaskColumn title="To Do" status="TODO" columnTasks={tasks.filter(t => t.status === 'TODO')} />
                            <TaskColumn title="In Progress" status="IN_PROGRESS" columnTasks={tasks.filter(t => t.status === 'IN_PROGRESS')} />
                            <TaskColumn title="Done" status="DONE" columnTasks={tasks.filter(t => t.status === 'DONE')} />
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center space-x-4 mb-8">
                                <button 
                                    onClick={() => setPage(p => Math.max(0, p - 1))} 
                                    disabled={page === 0}
                                    className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 font-semibold shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-sm font-bold text-gray-500">
                                    Page {page + 1} of {totalPages}
                                </span>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                                    disabled={page >= totalPages - 1}
                                    className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 font-semibold shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white">
                        <h3 className="text-2xl font-black text-gray-800 mb-6">{currentTask.id ? 'Update Mission' : 'New Mission'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title</label>
                                <div className="flex space-x-2">
                                    <input type="text" required value={currentTask.title} onChange={e => setCurrentTask({...currentTask, title: e.target.value})} className="flex-1 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 text-sm transition-all shadow-inner" placeholder="e.g., Prepare client presentation" />
                                    <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 flex items-center transition-all disabled:opacity-50 disabled:scale-100">
                                        <Sparkles className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} /> {isGenerating ? '...' : 'AI'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea value={currentTask.description} onChange={e => setCurrentTask({...currentTask, description: e.target.value})} className="w-full rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 text-sm transition-all shadow-inner min-h-[100px]" rows="3"></textarea>
                            </div>
                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
                                    <select value={currentTask.priority} onChange={e => setCurrentTask({...currentTask, priority: e.target.value})} className="w-full rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 text-sm transition-all font-semibold">
                                        <option value="LOW">Low Priority</option>
                                        <option value="MEDIUM">Medium Priority</option>
                                        <option value="HIGH">High Priority</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                                    <select value={currentTask.status} onChange={e => setCurrentTask({...currentTask, status: e.target.value})} className="w-full rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 text-sm transition-all font-semibold">
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="DONE">Done</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl shadow-md text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors">Save Mission</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showAuditModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
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
        </div>
    );
};

export default Dashboard;
