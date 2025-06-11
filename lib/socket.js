import { Server } from 'socket.io';
import { createServer } from 'http';

let io;

export function initSocket(app) {
  const httpServer = createServer(app);
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('用戶已連接:', socket.id);

    // 加入角色特定的房間
    socket.on('join-role', (role) => {
      socket.join(`role-${role}`);
    });

    // 加入訂單特定的房間
    socket.on('join-order', (orderId) => {
      socket.join(`order-${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log('用戶已斷開連接:', socket.id);
    });
  });

  return httpServer;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io 尚未初始化');
  }
  return io;
}

// 通知函數
export const notifyOrderCreated = (order) => {
  io.to('role-STAFF').emit('new-order', order);
};

export const notifyOrderStatusChanged = (orderId, status) => {
  io.to(`order-${orderId}`).emit('order-status-changed', { orderId, status });
};

export const notifyOrderReady = (order) => {
  io.to(`order-${order.id}`).emit('order-ready', order);
};

export const notifyOrderDelivered = (order) => {
  io.to(`order-${order.id}`).emit('order-delivered', order);
}; 