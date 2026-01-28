import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Store as StoreIcon, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { storeService } from '../services/api';

const Stores = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState(null);
    const [formData, setFormData] = useState({ store_id: '', store_location: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const data = await storeService.getAll();
            setStores(data);
        } catch (error) {
            console.error('Failed to fetch stores', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingStore) {
                await storeService.update(editingStore.store_id, formData);
            } else {
                await storeService.create(formData);
            }
            setIsModalOpen(false);
            fetchStores();
            resetForm();
        } catch (error) {
            console.error('Failed to save store', error);
            alert('Failed to save store');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this store?')) {
            try {
                await storeService.delete(id);
                fetchStores();
            } catch (error) {
                console.error('Failed to delete store', error);
                alert('Failed to delete store');
            }
        }
    };

    const openEditModal = (store) => {
        setEditingStore(store);
        setEditingStore(store);
        setFormData({ store_id: store.store_id, store_location: store.store_location });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingStore(null);
        setEditingStore(null);
        setFormData({ store_id: '', store_location: '' });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleDeleteAll = async () => {
        if (window.confirm('WARNING: Are you sure you want to delete ALL stores? This cannot be undone.')) {
            try {
                await storeService.deleteAll();
                fetchStores();
            } catch (error) {
                console.error(error);
                alert('Failed to delete all');
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Stores</h1>
                    <p className="text-slate-400 mt-1">Manage physical store locations</p>
                </div>
                <div className='flex gap-2'>
                    <Button variant="danger" size="sm" onClick={handleDeleteAll} disabled={stores.length === 0}>
                        Delete All
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} className="mr-2" />
                        Add Store
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                    <Card key={store.store_id || store.id} className="group hover:border-primary/50 transition-colors">
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-slate-800 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <StoreIcon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{store.store_location}</h3>
                                    <p className="text-xs text-slate-500">ID: {store.store_id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditModal(store)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(store.store_id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {stores.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                        No stores found. Create one to get started.
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingStore ? 'Edit Store' : 'Add New Store'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Store ID"
                        type="number"
                        value={formData.store_id}
                        onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                        placeholder="e.g. 101"
                        required
                        disabled={!!editingStore} // Disable ID editing when updating
                        autoFocus
                    />
                    <Input
                        label="Store Location"
                        value={formData.store_location}
                        onChange={(e) => setFormData({ ...formData, store_location: e.target.value })}
                        placeholder="e.g. New York, 5th Avenue"
                        required
                        autoFocus
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={submitting}>
                            {editingStore ? 'Update Store' : 'Create Store'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Stores;
