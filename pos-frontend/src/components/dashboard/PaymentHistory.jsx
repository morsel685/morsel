import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getPaymentHistory } from "../../https";

const PaymentHistory = () => {
    const { data: response, isLoading, isError } = useQuery({
        queryKey: ["paymentHistory"],
        queryFn: getPaymentHistory,
    });

    const payments = response?.data?.data || [];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-red-500 text-center p-4">
                Failed to load payment history.
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-[#f5f5f5] text-2xl font-semibold mb-6">
                Payment History
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg shadow-lg min-h-[300px] md:h-[calc(100vh-24rem)] overflow-y-auto scrollbar-hide">
                <table className="w-full text-left text-[#f5f5f5]">
                    <thead className="bg-[#262626] text-[#ababab] uppercase text-sm font-medium sticky top-0 z-10 shadow-md">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Order No.</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Method</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333]">
                        {payments.length > 0 ? (
                            payments.map((payment) => (
                                <tr key={payment._id} className="hover:bg-[#202020] transition">
                                    <td className="px-6 py-4 text-sm">
                                        {new Date(payment.createdAt).toLocaleDateString()}
                                        <br />
                                        <span className="text-xs text-[#ababab]">
                                            {new Date(payment.createdAt).toLocaleTimeString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        #{payment.orderNumber}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="font-medium">
                                            {payment.customerDetails?.name || "Walk-in"}
                                        </div>
                                        <div className="text-xs text-[#ababab]">
                                            {payment.customerDetails?.phone}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#02ca3a] font-semibold">
                                        ₹{payment.bills?.totalWithTax.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${payment.paymentMethod === "Cash"
                                                ? "bg-[#2d5a27] text-[#4cd964]"
                                                : payment.paymentMethod === "UPI"
                                                    ? "bg-[#025cca] text-[#3b82f6]"
                                                    : "bg-[#7f167f] text-[#d946ef]"
                                                }`}
                                        >
                                            {payment.paymentMethod || "Unknown"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-[#ababab]">
                                    No payment records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentHistory;
