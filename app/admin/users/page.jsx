"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UsersManagementPage() {
    const [users, setUsers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "CUSTOMER",
        address: "",
        avatarUrl: ""
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // 指定要查詢的角色
            const rolesToFetch = ["STAFF", "CHEF", "CAPTAIN"];
            const queryString = new URLSearchParams({
                roles: rolesToFetch.join(",")
            }).toString();

            const response = await fetch(`/api/users?${queryString}`);
            if (!response.ok) throw new Error("獲取用戶列表失敗");
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("獲取用戶列表失敗:", error);
            setError("獲取用戶列表失敗");
        }
    };

    const handleImageUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "上傳失敗");
            }

            return data.url;
        } catch (error) {
            console.error("上傳照片失敗:", error);
            setError("上傳照片失敗: " + error.message);
            return null;
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 檢查檔案類型
        if (!file.type.startsWith("image/")) {
            setError("請上傳圖片檔案");
            return;
        }

        // 檢查檔案大小（限制為 5MB）
        if (file.size > 5 * 1024 * 1024) {
            setError("圖片大小不能超過 5MB");
            return;
        }

        setIsUploading(true);
        setError("");

        try {
            // 創建預覽 URL
            const previewUrl = URL.createObjectURL(file);
            setPreviewImage(previewUrl);

            // 上傳圖片
            const imageUrl = await handleImageUpload(file);
            if (imageUrl) {
                setFormData(prev => ({
                    ...prev,
                    avatarUrl: imageUrl
                }));
            }
        } catch (error) {
            console.error("處理圖片失敗:", error);
            setError("處理圖片失敗: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const url = isEditing ? `/api/users/${selectedUser.id}` : "/api/users";
            const method = isEditing ? "PUT" : "POST";
            
            // 準備要發送的資料
            const dataToSend = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                phone: formData.phone || null,
                address: formData.address || null,
                avatarUrl: formData.avatarUrl || null
            };

            // 如果是新增用戶，添加密碼
            if (!isEditing) {
                dataToSend.password = formData.password;
            }

            console.log("發送資料:", dataToSend);

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();
            console.log("回應資料:", data);

            if (!response.ok) {
                throw new Error(data.message || "操作失敗");
            }

            await fetchUsers();
            resetForm();
            setIsCreating(false);
        } catch (error) {
            console.error("操作失敗:", error);
            setError(error.message || "操作失敗");
        }
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: "",
            phone: user.phone || "",
            role: user.role,
            address: user.address || "",
            avatarUrl: user.avatarUrl || ""
        });
        if (user.avatarUrl) {
            setPreviewImage(user.avatarUrl);
        } else {
            setPreviewImage(null);
        }
        setIsEditing(true);
        setIsCreating(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("確定要刪除此用戶嗎？")) return;

        try {
            const response = await fetch(`/api/users/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "刪除失敗");
            }

            await fetchUsers();
            setError("");
        } catch (error) {
            console.error("刪除用戶失敗:", error);
            setError(error.message || "刪除用戶失敗");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            phone: "",
            role: "CUSTOMER",
            address: "",
            avatarUrl: ""
        });
        setPreviewImage(null);
        setIsCreating(false);
        setIsEditing(false);
        setSelectedUser(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-6 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">用戶管理</h1>
                    <Sheet open={isCreating} onOpenChange={setIsCreating}>
                        <SheetTrigger asChild>
                            <button className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-md hover:opacity-90 transition">
                                新增員工
                    </button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>{isEditing ? "編輯用戶" : "新增用戶"}</SheetTitle>
                            </SheetHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-20">
                {error && (
                                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                                <div className="space-y-2">
                                    <Label htmlFor="avatar">照片</Label>
                                    <input
                                        type="file"
                                        id="avatar"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full border rounded-md px-3 py-2"
                                        disabled={isUploading}
                                    />
                                    {isUploading && (
                                        <div className="text-sm text-gray-600">
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
                                <div className="space-y-2">
                                <Label htmlFor="name">姓名</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                                <div className="space-y-2">
                                <Label htmlFor="email">電子信箱</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            {!isEditing && (
                                    <div className="space-y-2">
                                    <Label htmlFor="password">密碼</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required={!isEditing}
                                    />
                                </div>
                            )}
                                <div className="space-y-2">
                                <Label htmlFor="phone">電話</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">角色</Label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                        className="w-full border rounded-md px-3 py-2"
                                    required
                                >
                                    <option value="STAFF">服務人員</option>
                                    <option value="CHEF">廚師</option>
                                    <option value="CAPTAIN">外送員</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="address">地址</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="flex gap-2 fixed bottom-0 left-0 right-0 bg-white p-4 border-t">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-md hover:opacity-90 transition"
                                    >
                                        {isEditing ? "更新" : "新增"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                                    >
                                        取消
                                    </button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.name}
                                            className="w-16 h-16 object-cover rounded-full"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                            <span className="text-2xl text-gray-500">
                                                {user.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            {user.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        user.role === "OWNER"
                                            ? "bg-purple-100 text-purple-800"
                                            : user.role === "STAFF"
                                            ? "bg-blue-100 text-blue-800"
                                            : user.role === "CHEF"
                                            ? "bg-orange-100 text-orange-800"
                                            : user.role === "CAPTAIN"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                    {user.role === "OWNER"
                                        ? "老闆"
                                        : user.role === "STAFF"
                                        ? "服務人員"
                                        : user.role === "CHEF"
                                        ? "廚師"
                                        : user.role === "CAPTAIN"
                                        ? "外送員"
                                        : "顧客"}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    <span className="font-medium">電話：</span>
                                    {user.phone}
                                </p>
                                <p>
                                    <span className="font-medium">地址：</span>
                                    {user.address}
                                </p>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition text-sm"
                                >
                                    編輯
                                </button>
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition text-sm"
                                >
                                    刪除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 