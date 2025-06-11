"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

export default function StaffManagementPage() {
    const [staff, setStaff] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "STAFF",
        address: "",
        avatarUrl: ""
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await fetch("/api/users");
            if (!response.ok) throw new Error("獲取員工列表失敗");
            const data = await response.json();
            setStaff(data);
        } catch (error) {
            console.error("獲取員工列表失敗:", error);
            setError("獲取員工列表失敗");
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
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageChange = async (e) => {
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
            setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
        } catch (error) {
            console.error("圖片上傳失敗:", error);
            setError("圖片上傳失敗");
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
            const url = isEditing ? `/api/users/${selectedStaff.id}` : "/api/users";
            const method = isEditing ? "PUT" : "POST";
            
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "操作失敗");
            }

            await fetchStaff();
            resetForm();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleEdit = (staff) => {
        setSelectedStaff(staff);
        setFormData({
            name: staff.name,
            email: staff.email,
            password: "",
            phone: staff.phone,
            role: staff.role,
            address: staff.address,
            avatarUrl: staff.avatarUrl
        });
        setPreviewImage(staff.avatarUrl);
        setIsEditing(true);
        setIsCreating(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("確定要刪除此員工嗎？")) return;

        try {
            const response = await fetch(`/api/users/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) throw new Error("刪除失敗");

            await fetchStaff();
        } catch (error) {
            setError(error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            phone: "",
            role: "STAFF",
            address: "",
            avatarUrl: ""
        });
        setPreviewImage(null);
        setIsCreating(false);
        setIsEditing(false);
        setSelectedStaff(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 px-4 sm:px-6 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">員工管理</h1>
                    <Sheet open={isCreating} onOpenChange={setIsCreating}>
                        <SheetTrigger asChild>
                            <button className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-md hover:opacity-90 transition">
                                {isEditing ? "編輯員工" : "新增員工"}
                            </button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>{isEditing ? "編輯員工" : "新增員工"}</SheetTitle>
                            </SheetHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                                    <Label htmlFor="role">職位</Label>
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
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-md hover:opacity-90 transition"
                                    >
                                        {isEditing ? "更新" : "新增"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
                                    >
                                        取消
                                    </button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map((employee) => (
                        <div
                            key={employee.id}
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    {employee.avatarUrl ? (
                                        <img
                                            src={employee.avatarUrl}
                                            alt={employee.name}
                                            className="w-16 h-16 object-cover rounded-full"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                            <span className="text-2xl text-gray-500">
                                                {employee.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">
                                            {employee.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">{employee.email}</p>
                                    </div>
                                </div>
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        employee.role === "CHEF"
                                            ? "bg-orange-100 text-orange-800"
                                            : employee.role === "CAPTAIN"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                    {employee.role === "CHEF" ? "廚師" : employee.role === "CAPTAIN" ? "外送員" : "服務人員"}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    <span className="font-medium">電話：</span>
                                    {employee.phone}
                                </p>
                                <p>
                                    <span className="font-medium">地址：</span>
                                    {employee.address}
                                </p>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => handleEdit(employee)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition text-sm"
                                >
                                    編輯
                                </button>
                                <button
                                    onClick={() => handleDelete(employee.id)}
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