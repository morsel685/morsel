import React, { useState, useEffect, useMemo } from "react";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { enqueueSnackbar } from "notistack"

const Orders = () => {

  const [status, setStatus] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "Morsel | Orders"
  }, [])

  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    staleTime: 0,
  })

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" })
  }

  // Filter orders based on selected status
  const filteredOrders = useMemo(() => {
    const orders = resData?.data?.data || [];
    if (status === "all") return orders;

    return orders.filter((order) => {
      const orderStatus = order.orderStatus?.toLowerCase() || "";
      if (status === "progress") return orderStatus === "in progress";
      if (status === "ready") return orderStatus === "ready";
      if (status === "completed") return orderStatus === "completed";
      if (status === "cancelled") return orderStatus === "cancelled";
      return true;
    });
  }, [resData, status]);

  const handleOrderUpdate = () => {
    // Refresh orders after update
    queryClient.invalidateQueries(["orders"]);
  };

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-10 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Orders
          </h1>
        </div>
        <div className="flex items-center justify-around gap-4">
          <button onClick={() => setStatus("all")} className={`text-[#ababab] text-lg ${status === "all" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            All
          </button>
          <button onClick={() => setStatus("progress")} className={`text-[#ababab] text-lg ${status === "progress" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            In Progress
          </button>
          <button onClick={() => setStatus("ready")} className={`text-[#ababab] text-lg ${status === "ready" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Ready
          </button>
          <button onClick={() => setStatus("completed")} className={`text-[#ababab] text-lg ${status === "completed" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Completed
          </button>
          <button onClick={() => setStatus("cancelled")} className={`text-[#ababab] text-lg ${status === "cancelled" && "bg-[#383838] rounded-lg px-5 py-2"}  rounded-lg px-5 py-2 font-semibold`}>
            Cancelled
          </button>
        </div>
      </div>

      <div 
        className="px-16 py-4 flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-24"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}
      >
        {
          filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              return <OrderCard key={order._id} order={order} onUpdate={handleOrderUpdate} />
            })
          ) : <p className="col-span-3 text-gray-500 text-center py-10">No orders available</p>
        }
      </div>

      <BottomNav />
    </section>
  );
};

export default Orders;
