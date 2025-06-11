"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

export default function MenuManagementPage() {
    const [menuItems, setMenuItems] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newItem, setNewItem] = useState({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        isAvailable: true,
        category: "漢堡類",
    });
    const [editingId, setEditingId] = useState(null);
    const [editItem, setEditItem] = useState({});
    const [previewImage, setPreviewImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeCategory, setActiveCategory] = useState("全部");

    useEffect(() => {
        getMenu();
    }, []);

    const getMenu = async () => {
        try {
            const response = await fetch("/api/menu");
            if (!response.ok) throw new Error("獲取菜單失敗");
            const data = await response.json();
            setMenuItems(data);
        } catch (error) {
            console.error("獲取菜單失敗:", error);
            toast.error("獲取菜單失敗，請稍後再試");
        }
    };

    const handleImageUpload = async (file) => {
        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("上傳失敗");
            }

            const data = await response.json();
            return data.url;
        } catch (error) {
            console.error("圖片上傳失敗:", error);
            toast.error("圖片上傳失敗，請稍後再試");
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageChange = async (e, isEditing = false) => {
        const file = e.target.files[0];
        if (!file) return;

        // 顯示預覽
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);

        try {
            const imageUrl = await handleImageUpload(file);
            if (imageUrl) {
                if (isEditing) {
                    setEditItem(prev => ({ ...prev, imageUrl }));
                } else {
                    setNewItem(prev => ({ ...prev, imageUrl }));
                }
            }
        } catch (error) {
            console.error("圖片上傳失敗:", error);
            toast.error("圖片上傳失敗，請稍後再試");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        try {
            const itemToSend = {
                ...newItem,
                price: parseFloat(newItem.price) || 0,
            };

            const response = await fetch("/api/menu", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(itemToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "新增失敗");
            }
            const data = await response.json();
            setMenuItems((prev) => [...prev, data]);
            setNewItem({
                name: "",
                description: "",
                price: "",
                imageUrl: "",
                isAvailable: true,
                category: "漢堡類",
            });
            setIsCreating(false);
            toast.success("餐點新增成功！");
        } catch (error) {
            console.error("新增餐點失敗:", error.message);
            toast.error(error.message || "新增餐點失敗，請稍後再試");
        }
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        setEditItem({
            name: item.name,
            description: item.description,
            price: item.price.toString(),
            imageUrl: item.imageUrl || "",
            isAvailable: item.isAvailable,
            category: item.category || "漢堡類",
        });
        if (item.imageUrl) {
            setPreviewImage(item.imageUrl);
        } else {
            setPreviewImage(null);
        }
    };

    const handleEdit = async (id) => {
        try {
            const updatedItemToSend = {
                ...editItem,
                price: parseFloat(editItem.price) || 0,
            };

            const response = await fetch(`/api/menu/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedItemToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "更新失敗");
            }
            const updatedItem = await response.json();

            setMenuItems((prev) =>
                prev.map((item) => (item.id === id ? updatedItem : item))
            );
            setEditingId(null);
            toast.success("餐點更新成功！");
        } catch (error) {
            console.error("更新餐點失敗:", error.message);
            toast.error(error.message || "更新餐點失敗，請稍後再試");
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditItem({});
        setPreviewImage(null);
    };

    const handleDelete = async (id) => {
        if (!confirm("確定要刪除此餐點嗎？")) return;

        try {
            const response = await fetch(`/api/menu/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "刪除失敗");
            }

            setMenuItems((prev) => prev.filter((item) => item.id !== id));
            toast.success("餐點刪除成功！");
        } catch (error) {
            console.error("刪除餐點失敗:", error.message);
            toast.error(error.message || "刪除餐點失敗，請稍後再試");
        }
    };

    const categories = ["全部", ...new Set(menuItems.map(item => item.category))];

    const filteredMenuItems = activeCategory === "全部" 
        ? menuItems 
        : menuItems.filter(item => item.category === activeCategory);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-8 py-8">
            <Toaster position="top-right" />
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800 text-center sm:text-left">
                        🍱 菜單管理
                    </h1>
                    <button
                        onClick={() => {
                            setIsCreating(true);
                            setPreviewImage(null);
                            setNewItem({
                                name: "",
                                description: "",
                                price: "",
                                imageUrl: "",
                                isAvailable: true,
                                category: "漢堡類",
                            });
                        }}
                        className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-2 rounded-md shadow hover:opacity-90 transition w-full sm:w-auto"
                    >
                        新增菜單
                    </button>
                </div>

                <div className="mb-6 overflow-x-auto">
                    <div className="flex space-x-2 pb-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                    activeCategory === category
                                        ? "bg-gradient-to-r from-pink-500 to-red-500 text-white"
                                        : "bg-white text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {isCreating && ( !editingId &&
                    <div className="bg-white p-6 rounded-lg shadow-lg mb-10">
                        <h2 className="text-xl font-semibold mb-4">新增餐點</h2>
                        <form
                            onSubmit={handleCreate}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                    名稱
                                </label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            name: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                    價格
                                </label>
                                <input
                                    type="number"
                                    value={newItem.price}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            price: e.target.value,
                                        })
                                    }
                                    min="0"
                                    step="0.01"
                                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-400"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                    描述
                                </label>
                                <textarea
                                    value={newItem.description}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            description: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-400"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                    分類
                                </label>
                                <select
                                    value={newItem.category}
                                    onChange={(e) =>
                                        setNewItem({
                                            ...newItem,
                                            category: e.target.value,
                                        })
                                    }
                                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-400"
                                    required
                                >
                                    {[...new Set(menuItems.map(item => item.category))].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                    圖片
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageChange(e)}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-400"
                                    disabled={isUploading}
                                />
                                {isUploading && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        圖片上傳中...
                                    </div>
                                )}
                                {previewImage && (
                                    <div className="mt-2">
                                        <img
                                            src={previewImage}
                                            alt="預覽"
                                            className="w-32 h-32 object-cover rounded-md"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 md:col-span-2">
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-md shadow hover:opacity-90 transition"
                                >
                                    新增
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setPreviewImage(null);
                                        setNewItem({
                                            name: "",
                                            description: "",
                                            price: "",
                                            imageUrl: "",
                                            isAvailable: true,
                                            category: "漢堡類",
                                        });
                                    }}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                                >
                                    取消
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMenuItems.map((item) =>
                        editingId === item.id ? (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl shadow-lg p-5 relative"
                            >
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    編輯餐點
                                </h3>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleEdit(item.id);
                                    }}
                                    className="space-y-4"
                                >
                                    <label className="block mb-1 ms-2 font-medium text-gray-700">
                                        名稱
                                    </label>
                                    <input
                                        type="text"
                                        value={editItem.name}
                                        onChange={(e) =>
                                            setEditItem({
                                                ...editItem,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-400"
                                        required
                                        placeholder="名稱"
                                    />
                                    <label className="block mb-1 ms-2 font-medium text-gray-700">
                                        價格
                                    </label>
                                    <input
                                        type="number"
                                        value={editItem.price}
                                        onChange={(e) =>
                                            setEditItem({
                                                ...editItem,
                                                price: e.target.value,
                                            })
                                        }
                                        min="0"
                                        step="0.01"
                                        className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-400"
                                        required
                                        placeholder="價格"
                                    />
                                    <label className="block mb-1 ms-2 font-medium text-gray-700">
                                        敘述
                                    </label>
                                    <textarea
                                        value={editItem.description}
                                        onChange={(e) =>
                                            setEditItem({
                                                ...editItem,
                                                description: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-400"
                                        placeholder="描述"
                                    />
                                    <label className="block mb-1 text-sm font-medium text-gray-700">
                                        分類
                                    </label>
                                    <select
                                        value={editItem.category}
                                        onChange={(e) =>
                                            setEditItem({
                                                ...editItem,
                                                category: e.target.value,
                                            })
                                        }
                                        className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-400"
                                        required
                                    >
                                        {[...new Set(menuItems.map(item => item.category))].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <label className="inline-flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={editItem.isAvailable}
                                            onChange={(e) =>
                                                setEditItem({
                                                    ...editItem,
                                                    isAvailable:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        <span>供應中</span>
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            type="submit"
                                            className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-md shadow hover:opacity-90 transition"
                                        >
                                            儲存
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition relative"
                            >
                                {item.imageUrl ? (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.name}
                                        width={400}
                                        height={250}
                                        className="rounded-md w-full h-48 object-cover mb-4"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                                        <span className="text-gray-500">無圖片</span>
                                    </div>
                                )}
                                <h3 className="text-lg font-bold text-gray-800 mb-1">
                                    {item.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                                    {item.description}
                                </p>
                                <div className="flex flex-wrap justify-between items-center gap-2">
                                    <span className="text-pink-600 font-semibold text-lg">
                                        ${item.price.toFixed(2)}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            item.isAvailable
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                        {item.isAvailable ? "供應中" : "已下架"}
                                    </span>
                                    {item.category && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                            {item.category}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={() => startEditing(item)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transition duration-300 ease-in-out"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        編輯
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-lg shadow-md hover:from-red-600 hover:to-red-700 hover:shadow-lg transition duration-300 ease-in-out"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        刪除
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
