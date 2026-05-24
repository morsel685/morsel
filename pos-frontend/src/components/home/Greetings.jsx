import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const Greetings = () => {
  const userData = useSelector(state => state.user);
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  };

  const formatTime = (date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

  const getGreeting = () => {
    const hour = dateTime.getHours();
    if (hour >= 5 && hour < 12) {
      return { text: "Good Morning", emoji: "🌅" };
    } else if (hour >= 12 && hour < 17) {
      return { text: "Good Afternoon", emoji: "☀️" };
    } else if (hour >= 17 && hour < 21) {
      return { text: "Good Evening", emoji: "🌆" };
    } else {
      return { text: "Good Night", emoji: "🌙" };
    }
  };

  const greeting = getGreeting();

  return (
    <div className="flex justify-between items-center px-8 mt-5">
      <div>
        <h1 className="text-[#f5f5f5] text-2xl font-semibold tracking-wide">
          {greeting.text}, {userData.name || "TEST USER"} {greeting.emoji}
        </h1>
        <p className="text-[#ababab] text-sm">
          Give your best services for customers 😀
        </p>
      </div>
      <div>
        <h1 className="text-[#f5f5f5] text-3xl font-bold tracking-wide w-[130px]">{formatTime(dateTime)}</h1>
        <p className="text-[#ababab] text-sm">{formatDate(dateTime)}</p>
      </div>
    </div>
  );
};

export default Greetings;
