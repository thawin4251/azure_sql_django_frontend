import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Check, X, Loader2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { orderService, productService, storeService, userService } from '../services/api';

const OrderWizard = ({ isOpen, onClose, onOrderCreated }) => {
    const [products, setProducts] = useState([]);
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [cart, setCart] = useState({}); // { productId: quantity }
    const [selectedStore, setSelectedStore] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
            setCart({});
            setSelectedStore('');
            setSelectedUser('');
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            const [productsData, storesData, usersData] = await Promise.all([
                productService.getAll(),
                storeService.getAll(),
                userService.getAll()
            ]);
            setProducts(productsData);
            setStores(storesData);
            setUsers(usersData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = (productId, delta) => {
        setCart(prev => {
            const current = prev[productId] || 0;
            const next = Math.max(0, current + delta);
            if (next === 0) {
                const { [productId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [productId]: next };
        });
    };

    const calculateTotal = () => {
        return Object.entries(cart).reduce((total, [pid, qty]) => {
            const product = products.find(p => p.id === parseInt(pid));
            return total + (product ? parseFloat(product.price) * qty : 0);
        }, 0);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const items = Object.entries(cart).map(([pid, qty]) => ({
            product: parseInt(pid),
            quantity: qty
        }));

        try {
            if (!selectedStore || !selectedUser) {
                alert('Please select a Store and User');
                setSubmitting(false);
                return;
            }

            await orderService.create({
                items,
                store_id: parseInt(selectedStore),
                user_id: parseInt(selectedUser)
            });
            onOrderCreated();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to create order');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Order" className="max-w-4xl">
            <div className="flex flex-col md:flex-row gap-6 h-[600px]">
                {/* Product Selection */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar border-r border-slate-700/50">
                    <div className="sticky top-0 bg-surface z-10 space-y-4 pb-4 mb-4 border-b border-slate-700/50">
                        <h3 className="font-semibold text-white">Order Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Store</label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm"
                                    value={selectedStore}
                                    onChange={(e) => setSelectedStore(e.target.value)}
                                >
                                    <option value="">Select Store</option>
                                    {stores.map(s => (
                                        <option key={s.store_id || s.id} value={s.store_id || s.id}>
                                            {s.store_location}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">User</label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-sm"
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                >
                                    <option value="">Select User</option>
                                    {users.map(u => (
                                        <option key={u.user_id || u.id} value={u.user_id || u.id}>
                                            {u.username || u.name || `User ${u.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <h3 className="font-semibold text-white mb-4">Select Products</h3>
                    {loading ? <Loader2 className="animate-spin" /> : (
                        <div className="space-y-3">
                            {products.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50">
                                    <div>
                                        <p className="font-medium text-white">{product.name}</p>
                                        <p className="text-sm text-slate-400">${product.price}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {cart[product.id] ? (
                                            <div className="flex items-center bg-slate-900 rounded-lg">
                                                <button onClick={() => updateQuantity(product.id, -1)} className="px-2 py-1 hover:text-primary">-</button>
                                                <span className="w-8 text-center text-sm">{cart[product.id]}</span>
                                                <button onClick={() => updateQuantity(product.id, 1)} className="px-2 py-1 hover:text-primary">+</button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="secondary" onClick={() => updateQuantity(product.id, 1)}>Add</Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart Summary */}
                <div className="w-full md:w-80 flex flex-col">
                    <h3 className="font-semibold text-white mb-4">Order Summary</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 bg-slate-900/30 rounded-lg p-4 space-y-3">
                        {Object.keys(cart).length === 0 ? (
                            <div className="text-center text-slate-500 mt-10">Cart is empty</div>
                        ) : (
                            Object.entries(cart).map(([pid, qty]) => {
                                const product = products.find(p => p.id === parseInt(pid));
                                if (!product) return null;
                                return (
                                    <div key={pid} className="flex justify-between text-sm">
                                        <span className="text-slate-300">{product.name} x {qty}</span>
                                        <span className="text-white font-medium">${(parseFloat(product.price) * qty).toFixed(2)}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-700 space-y-4">
                        <div className="flex justify-between items-center text-xl font-bold text-white">
                            <span>Total</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleSubmit}
                            isLoading={submitting}
                            disabled={Object.keys(cart).length === 0}
                        >
                            Place Order
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await orderService.getAll();
            setOrders(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete order?')) {
            try {
                await orderService.delete(id);
                fetchOrders();
            } catch (e) { console.error(e); }
        }
    }

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Orders</h1>
                    <p className="text-slate-400 mt-1">Track and manage customer orders</p>
                </div>
                <Button onClick={() => setIsWizardOpen(true)}>
                    <Plus size={20} className="mr-2" />
                    Create Order
                </Button>
            </div>

            <div className="bg-surface/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700/50 bg-slate-800/50">
                            <th className="p-4 font-medium text-slate-300">Order ID</th>
                            <th className="p-4 font-medium text-slate-300">Status</th>
                            <th className="p-4 font-medium text-slate-300">Date</th>
                            <th className="p-4 font-medium text-slate-300">Items</th>
                            <th className="p-4 font-medium text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 text-white font-medium">#{order.id}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        order.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                            'bg-slate-500/10 text-slate-400 border-slate-400/20'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-400 text-sm">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-white">
                                    <div className="flex items-center gap-2">
                                        <Package size={16} className="text-primary" />
                                        <span>{order.items ? order.items.length : 0} Items</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDelete(order.id)} className="text-slate-500 hover:text-red-500 transition-colors">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    No orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <OrderWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onOrderCreated={fetchOrders}
            />
        </div>
    );
};

export default Orders;
