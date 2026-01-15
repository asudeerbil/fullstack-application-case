import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// --- TYPE DEFINITIONS ---
type Todo = {
    id: number;
    title: string;
    description: string | null;
    status: string;
    deleted_at: string | null;
    created_at: string;
    user: { name: string; id: number };
};

type Props = PageProps & {
    todos: { data: Todo[] };
    isAdmin: boolean;
};

const COLUMNS: Record<string, { title: string; color: string; bg: string }> = {
    todo: { title: 'To Do', color: 'text-gray-600', bg: 'bg-gray-100' },
    in_progress: { title: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-50' },
    done: { title: 'Done', color: 'text-green-600', bg: 'bg-green-50' },
};

export default function Index({ todos, isAdmin, auth }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [boardData, setBoardData] = useState<Todo[]>(todos.data);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
    const [showTrash, setShowTrash] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Backend verisi değiştikçe board'u güncelle
    useEffect(() => {
        setBoardData(todos.data);
    }, [todos.data]);

    // Flash mesajlarını bildirim olarak göster
    useEffect(() => {
        if (flash?.success) {
            setNotification({ type: 'success', message: flash.success });
            setTimeout(() => setNotification(null), 4000);
        }
        if (flash?.error) {
            setNotification({ type: 'error', message: flash.error });
            setTimeout(() => setNotification(null), 4000);
        }
    }, [flash]);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        title: '',
        description: '',
    });

    // Düzenleme moduna girildiğinde form verilerini doldur
    useEffect(() => {
        if (editingTodo) {
            setData({
                title: editingTodo.title || '',
                description: editingTodo.description || '',
            });
        }
    }, [editingTodo]);

    // --- ACTIONS ---
    const openCreateModal = () => {
        setEditingTodo(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (todo: Todo) => {
        setEditingTodo(todo);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this task?')) {
            router.delete(route('todos.destroy', id), {
                preserveScroll: true
            });
        }
    };

    const handleRestore = (id: number) => {
        router.patch(route('todos.restore', id), {}, {
            preserveScroll: true
        });
    };

    const handlePermanentDelete = (id: number) => {
        if (confirm('Permanently delete this task? This cannot be undone!')) {
            router.delete(route('todos.force-delete', id), {
                preserveScroll: true
            });
        }
    };

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

        const newStatus = destination.droppableId;
        const todoId = parseInt(draggableId);

        // Optimistic UI Update
        setBoardData(prev => prev.map(item => item.id === todoId ? { ...item, status: newStatus } : item));

        router.patch(route('todos.status', todoId), { status: newStatus }, {
            preserveScroll: true,
            onError: () => setBoardData(todos.data)
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingTodo) {
            // Update işlemi
            put(route('todos.update', editingTodo.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingTodo(null);
                    reset();
                },
            });
        } else {
            // Create işlemi
            post(route('todos.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const getTasksByStatus = (status: string) => {
        return boardData.filter(todo => todo.status === status && !todo.deleted_at);
    };

    const getDeletedTasks = () => {
        return boardData.filter(todo => todo.deleted_at);
    };

    const goToBoard = () => {
        setShowTrash(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <Head title="Todo" />
            <div className="max-w-7xl mx-auto">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <button
                            onClick={goToBoard}
                            className="text-3xl font-bold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                            Project Board
                        </button>
                        <p className="text-slate-500 mt-1">
                            Welcome, <span className="font-semibold text-slate-700">{auth?.user?.name}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openCreateModal}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-lg font-medium transition-all"
                        >
                            + New Task
                        </button>
                        <button
                            onClick={() => setShowTrash(!showTrash)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg shadow-lg font-medium transition-all flex items-center gap-2"
                        >
                            🗑️ Trash ({getDeletedTasks().length})
                        </button>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg shadow-lg font-medium transition-all"
                        >
                            Log Out
                        </Link>
                    </div>
                </div>

                {/* Notification Toast */}
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 max-w-md animate-slide-in ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                        } text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3`}>
                        {notification.type === 'success' ? (
                            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <span className="font-medium">{notification.message}</span>
                        <button
                            onClick={() => setNotification(null)}
                            className="ml-auto hover:bg-white/20 rounded p-1 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {!showTrash ? (
                    /* KANBAN BOARD */
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            {Object.entries(COLUMNS).map(([columnId, config]) => (
                                <Droppable key={columnId} droppableId={columnId}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`rounded-xl p-4 min-h-[550px] border border-slate-200 shadow-sm flex flex-col transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200' : 'bg-white'}`}
                                        >
                                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                                <h2 className={`font-bold text-lg ${config.color} flex items-center gap-2`}>
                                                    <span className={`w-3 h-3 rounded-full ${config.bg.replace('bg-', 'bg-opacity-100 bg-')}`}></span>
                                                    {config.title}
                                                </h2>
                                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-bold">
                                                    {getTasksByStatus(columnId).length}
                                                </span>
                                            </div>

                                            <div className="flex-1 space-y-3">
                                                {getTasksByStatus(columnId).map((todo, index) => (
                                                    <Draggable
                                                        key={todo.id}
                                                        draggableId={todo.id.toString()}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`p-4 rounded-lg border transition-all group relative bg-white ${snapshot.isDragging ? 'shadow-xl ring-2 ring-indigo-500 rotate-2' : 'shadow-sm border-slate-200'}`}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h3 className="font-semibold text-slate-800">
                                                                        {todo.title}
                                                                    </h3>

                                                                    <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                                                                        <button onClick={() => openEditModal(todo)} className="text-blue-500 hover:text-blue-700 text-xs font-bold bg-blue-50 px-1.5 py-0.5 rounded">Edit</button>
                                                                        <button onClick={() => handleDelete(todo.id)} className="text-red-500 hover:text-red-700 text-xs font-bold bg-red-50 px-1.5 py-0.5 rounded">Delete</button>
                                                                    </div>
                                                                </div>

                                                                {todo.description && (
                                                                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{todo.description}</p>
                                                                )}

                                                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50 text-[10px] text-slate-400 uppercase tracking-wider">
                                                                    <span>{new Date(todo.created_at).toLocaleDateString('en-GB')}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-slate-600">{todo.user?.name}</span>
                                                                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                                            {todo.user?.name?.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        </div>
                                    )}
                                </Droppable>
                            ))}
                        </div>
                    </DragDropContext>
                ) : (
                    /* TRASH VIEW */
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                            <h2 className="font-bold text-2xl text-red-600 flex items-center gap-2">
                                <span className="text-3xl">🗑️</span>
                                Trash
                            </h2>
                            <span className="bg-red-100 text-red-600 text-sm px-3 py-1 rounded-full font-bold">
                                {getDeletedTasks().length} items
                            </span>
                        </div>

                        {getDeletedTasks().length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <div className="text-6xl mb-3">🎉</div>
                                <p className="text-lg">Trash is empty!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {getDeletedTasks().map((todo) => (
                                    <div
                                        key={todo.id}
                                        className="p-4 rounded-lg border border-red-100 bg-red-50/50 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-slate-800 line-through opacity-70">
                                                {todo.title}
                                            </h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRestore(todo.id)}
                                                    className="text-green-600 hover:text-green-700 text-xs font-bold bg-green-100 px-2 py-1 rounded transition-colors"
                                                >
                                                    ↺ Restore
                                                </button>
                                                <button
                                                    onClick={() => handlePermanentDelete(todo.id)}
                                                    className="text-red-600 hover:text-red-700 text-xs font-bold bg-red-100 px-2 py-1 rounded transition-colors"
                                                >
                                                    Delete Forever
                                                </button>
                                            </div>
                                        </div>

                                        {todo.description && (
                                            <p className="text-sm text-slate-500 mb-3 line-clamp-2 opacity-70">
                                                {todo.description}
                                            </p>
                                        )}

                                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-red-100 text-[10px] text-slate-400 uppercase tracking-wider">
                                            <span>Deleted: {new Date(todo.deleted_at || '').toLocaleDateString('en-GB')}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-600">{todo.user?.name}</span>
                                                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
                                                    {todo.user?.name?.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {editingTodo ? 'Edit Task' : 'Create New Task'}
                            </h3>
                            <button onClick={() => { setIsModalOpen(false); setEditingTodo(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Task title"
                                    autoFocus
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="w-full border-gray-300 rounded-lg p-2.5 border h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Task details..."
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingTodo(null); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-colors"
                                >
                                    {processing ? 'Processing...' : (editingTodo ? 'Update Task' : 'Create Task')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}