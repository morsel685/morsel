import React, { useEffect, useMemo } from "react";
import BottomNav from "../components/shared/BottomNav";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import AnalyticsReport from "../components/home/AnalyticsReport";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders } from "../https/index";

const Home = () => {

  const { data: resData } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  // Calculate statistics from orders data
  const stats = useMemo(() => {
    const orders = resData?.data?.data || [];
    console.log('📊 Total orders:', orders.length);
    if (orders.length > 0) {
      console.log('Sample order:', orders[0]);
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Filter orders for today
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    // Filter orders for yesterday
    const yesterdayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === yesterday.getTime();
    });

    // Calculate pending payments (orders without payment method = unpaid)
    const unpaidOrders = orders.filter(order =>
      !order.paymentMethod && order.orderStatus?.toLowerCase() !== "cancelled"
    );
    console.log('💰 Unpaid orders:', unpaidOrders.length, unpaidOrders.map(o => ({ id: o._id, total: o.totalAmount, payment: o.paymentMethod, status: o.orderStatus })));
    if (unpaidOrders.length > 0) {
      console.log('🔍 Full unpaid order structure:', unpaidOrders[0]);
    }
    const pendingPayments = unpaidOrders.reduce((sum, order) => sum + (order.bills?.total || 0), 0);
    console.log('💵 Pending payments total:', pendingPayments);

    // Calculate yesterday's pending payments
    const yesterdayPending = yesterdayOrders.filter(order =>
      !order.paymentMethod && order.orderStatus?.toLowerCase() !== "cancelled"
    ).reduce((sum, order) => sum + (order.bills?.total || 0), 0);

    // Calculate in-progress orders (In Progress or Ready status)
    const inProgressOrders = orders.filter(order => {
      const status = order.orderStatus?.toLowerCase();
      return status === "in progress" || status === "ready";
    });
    console.log('🔄 In progress orders:', inProgressOrders.length, inProgressOrders.map(o => ({ id: o._id, status: o.orderStatus })));
    const inProgressCount = inProgressOrders.length;

    const yesterdayInProgress = yesterdayOrders.filter(order => {
      const status = order.orderStatus?.toLowerCase();
      return status === "in progress" || status === "ready";
    }).length;

    // Calculate percentage changes
    const pendingChange = yesterdayPending > 0
      ? ((pendingPayments - yesterdayPending) / yesterdayPending * 100).toFixed(1)
      : 0;

    const inProgressChange = yesterdayInProgress > 0
      ? ((inProgressCount - yesterdayInProgress) / yesterdayInProgress * 100).toFixed(1)
      : 0;

    return {
      pendingPayments: Math.round(pendingPayments),
      pendingChange: parseFloat(pendingChange),
      inProgressCount,
      inProgressChange: parseFloat(inProgressChange)
    };
  }, [resData]);

  useEffect(() => {
    document.title = "Morsel | Home"
  }, [])

  return (
    <section className="bg-[#1f1f1f]  h-[calc(100vh-5rem)] overflow-hidden flex gap-3">
      {/* Left Div */}
      <div className="flex-[3] h-full overflow-y-auto scrollbar-hide pb-6">
        <Greetings />
        <div className="flex items-center w-full gap-3 px-8 mt-8">
          <MiniCard
            title="Pending Payments"
            icon={<BsCashCoin />}
            number={stats.pendingPayments}
            footerNum={Math.abs(stats.pendingChange)}
          />
          <MiniCard
            title="In Progress"
            icon={<GrInProgress />}
            number={stats.inProgressCount}
            footerNum={Math.abs(stats.inProgressChange)}
          />
        </div>
        <AnalyticsReport />
      </div>
      {/* Right Div */}
      <div className="flex-[2] h-full overflow-y-auto scrollbar-hide pb-6">
        <RecentOrders />
      </div>
      <BottomNav />
    </section>
  );
};

export default Home;
