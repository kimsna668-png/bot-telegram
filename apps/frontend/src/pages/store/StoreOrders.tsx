import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useStore } from '../../context/StoreContext.js';
import { KHQRModal } from '../../components/store/KHQRModal.js';

export const StoreOrders: React.FC = () => {
  const { setActivePayment, activePayment } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, any>>({});
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users/orders');
      const loadedOrders = res.data.orders || [];
      setOrders(loadedOrders);

      // Fetch deliveries for paid/delivered orders
      const deliveryMap: Record<string, any> = {};
      const autoExpand: Record<string, boolean> = {};

      for (const order of loadedOrders) {
        if (order.status === 'PAID' || order.status === 'DELIVERED') {
          try {
            const delRes = await api.get(`/deliveries/order/${order._id}`);
            if (delRes.data.success) {
              deliveryMap[order._id] = delRes.data.delivery;
              autoExpand[order._id] = true;
            }
          } catch {}
        }
      }
      setDeliveries(deliveryMap);
      setExpandedOrders(autoExpand);
    } catch (err) {
      console.error('Error loading orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleResendTelegram = async (orderId: string) => {
    setResendingId(orderId);
    try {
      const res = await api.post(`/deliveries/resend/${orderId}`);
      if (res.data.success) {
        alert('Digital product delivery resent to your Telegram chat!');
      }
    } catch (err: any) {
      alert('Error resending: ' + (err.response?.data?.message || err.message));
    } finally {
      setResendingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Pending Payment
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-300 text-xs font-bold border border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0517] text-slate-100 flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#10061e]/90 backdrop-blur-md border-b border-purple-900/40 px-4 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to="/store"
            className="flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>
          <h1 className="text-sm font-bold text-white">My Orders & Downloads</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 flex-1 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-purple-950/40 animate-pulse border border-purple-900/30" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ShoppingBag className="w-14 h-14 text-purple-900 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No purchases found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your purchased licenses, downloads and courses will appear here.
            </p>
            <Link
              to="/store"
              className="mt-5 inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-purple-600/30"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const delivery = deliveries[order._id];
            const isExpanded = expandedOrders[order._id];

            return (
              <div
                key={order._id}
                className="bg-[#140826] border border-purple-800/40 rounded-2xl overflow-hidden shadow-lg transition-all"
              >
                {/* Order Summary Header */}
                <div
                  onClick={() => toggleExpand(order._id)}
                  className="p-4 cursor-pointer hover:bg-purple-900/20 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{order.orderNumber}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} item(s) •{' '}
                      <span className="font-bold text-purple-300">
                        {order.currency === 'USD'
                          ? `$${order.payableAmount.toFixed(2)}`
                          : `${order.payableAmount.toLocaleString()} ៛`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (order.paymentId) {
                            setActivePayment({
                              paymentId: order.paymentId._id || order.paymentId,
                              transactionRef: order.paymentId.transactionRef,
                              qrString: order.paymentId.qrString,
                              amount: order.payableAmount,
                              currency: order.currency,
                              expiresAt: order.expiresAt,
                              provider: order.paymentId.provider || 'BAKONG_KHQR'
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-purple-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                      >
                        Pay KHQR
                      </button>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Delivery Content */}
                {isExpanded && (
                  <div className="border-t border-purple-900/40 p-4 bg-[#10061e] space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Purchased Items & Digital Deliveries
                    </h4>

                    {order.items.map((item: any, idx: number) => {
                      const deliveryItem = delivery?.items?.find((d: any) => d.productId === item.productId);

                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-purple-950/70 border border-purple-800/40 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{item.productName}</span>
                            <span className="text-[11px] text-purple-300 font-semibold">Qty: {item.quantity}</span>
                          </div>

                          {/* License Keys */}
                          {deliveryItem?.licenseKeys && deliveryItem.licenseKeys.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[11px] text-amber-300 font-semibold">Allocated License Keys:</span>
                              {deliveryItem.licenseKeys.map((key: string, kIdx: number) => (
                                <div
                                  key={kIdx}
                                  className="flex items-center justify-between bg-black/50 border border-purple-800/50 rounded-lg p-2 font-mono text-xs text-amber-200"
                                >
                                  <span>{key}</span>
                                  <button
                                    onClick={() => handleCopy(key)}
                                    className="p-1 hover:text-white transition-colors"
                                    title="Copy"
                                  >
                                    {copiedKey === key ? (
                                      <Check className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Download Link */}
                          {deliveryItem?.downloadUrl && (
                            <div className="pt-1">
                              <a
                                href={deliveryItem.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition-colors shadow"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download Digital File
                              </a>
                            </div>
                          )}

                          {/* Access Details / Text Content */}
                          {deliveryItem?.deliveredContent && !deliveryItem.licenseKeys?.length && !deliveryItem.downloadUrl && (
                            <div className="p-2.5 bg-black/40 rounded-lg text-xs text-slate-300 whitespace-pre-line border border-purple-900/50">
                              {deliveryItem.deliveredContent}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Resend to Telegram Action */}
                    {order.status === 'DELIVERED' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleResendTelegram(order._id)}
                          disabled={resendingId === order._id}
                          className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{resendingId === order._id ? 'Sending...' : 'Resend to Telegram Chat'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      <KHQRModal paymentData={activePayment} onClose={() => setActivePayment(null)} onPaymentSuccess={loadOrders} />
    </div>
  );
};
