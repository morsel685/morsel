import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import Modal from "../components/shared/Modal";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { keepPreviousData, useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getTables, addTable, editTableDetails, deleteTable } from "../https";
import { enqueueSnackbar } from "notistack";

const Tables = () => {
  const [status, setStatus] = useState("all");
  const queryClient = useQueryClient();

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null); // null or table object
  const [tableForm, setTableForm] = useState({ tableNo: "", seats: "" });

  useEffect(() => {
    document.title = "Morsel | Tables"
  }, [])

  const { data: resData, isError } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      return await getTables();
    },
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  if (isError) {
    enqueueSnackbar("Something went wrong!", { variant: "error" })
  }

  const handleTableUpdate = () => {
    queryClient.invalidateQueries(["tables"]);
  };

  // Mutations
  const addTableMutation = useMutation({
    mutationFn: addTable,
    onSuccess: () => {
      queryClient.invalidateQueries(["tables"]);
      setIsAddOpen(false);
      setTableForm({ tableNo: "", seats: "" });
      enqueueSnackbar("Table added!", { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || "Failed to add table", { variant: "error" })
  });

  const editTableMutation = useMutation({
    mutationFn: editTableDetails,
    onSuccess: () => {
      queryClient.invalidateQueries(["tables"]);
      setEditingTable(null);
      setTableForm({ tableNo: "", seats: "" });
      enqueueSnackbar("Table updated!", { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || "Failed to update table", { variant: "error" })
  });

  const deleteTableMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries(["tables"]);
      enqueueSnackbar("Table deleted!", { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || "Failed to delete table", { variant: "error" })
  });

  const handleEditClick = (table) => {
    setEditingTable(table);
    setTableForm({ tableNo: table.tableNo, seats: table.seats });
  };

  const handleDeleteClick = (tableId) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      deleteTableMutation.mutate(tableId);
    }
  };

  // Filter tables based on status
  const filteredTables = resData?.data?.data?.filter((table) => {
    if (status === "all") return true;
    if (status === "booked") return table.status === "Booked";
    return true;
  }) || [];

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex flex-col pb-16 sm:pb-0">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 sm:px-10 py-4 gap-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Tables
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto">
          <button
            onClick={() => setStatus("all")}
            className={`text-[#ababab] text-sm sm:text-lg rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 font-semibold ${status === "all" ? "bg-[#383838] text-white" : ""}`}
          >
            All
          </button>
          <button
            onClick={() => setStatus("booked")}
            className={`text-[#ababab] text-sm sm:text-lg rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 font-semibold ${status === "booked" ? "bg-[#383838] text-white" : ""}`}
          >
            Booked
          </button>
          <button
            onClick={() => {
              setTableForm({ tableNo: "", seats: "" });
              setIsAddOpen(true);
            }}
            className="bg-yellow-500 text-black px-3 sm:px-5 py-2 rounded-lg flex items-center justify-center gap-2 font-bold hover:bg-yellow-400 transition text-xs sm:text-sm ml-auto sm:ml-0 flex-1 sm:flex-initial"
          >
            <FaPlus /> Add Table
          </button>
        </div>
      </div>

      <div 
        className="px-4 sm:px-16 py-4 flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-24"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}
      >
        {filteredTables.map((table) => {
          return (
            <TableCard
              key={table._id}
              id={table._id}
              name={table.tableNo}
              status={table.status}
              initials={table?.currentOrder?.customerDetails?.name}
              seats={table.seats}
              currentOrder={table.currentOrder}
              onUpdate={handleTableUpdate}
              onEdit={() => handleEditClick(table)}
              onDelete={() => handleDeleteClick(table._id)}
            />
          );
        })}
      </div>

      <BottomNav />

      {/* Add Table Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Table">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Table Number (e.g. 1, A1, VIP-2)"
            className="bg-[#333] text-white p-3 rounded outline-none border border-transparent focus:border-yellow-500"
            value={tableForm.tableNo}
            onChange={(e) => setTableForm({ ...tableForm, tableNo: e.target.value })}
          />
          <input
            type="number"
            placeholder="Number of Seats"
            className="bg-[#333] text-white p-3 rounded outline-none border border-transparent focus:border-yellow-500"
            value={tableForm.seats}
            onChange={(e) => setTableForm({ ...tableForm, seats: e.target.value })}
          />
          <button
            onClick={() => addTableMutation.mutate({ tableNo: tableForm.tableNo.trim(), seats: Number(tableForm.seats) })}
            className="bg-yellow-500 text-black font-bold p-3 rounded hover:bg-yellow-400 transition"
            disabled={addTableMutation.isPending || !tableForm.tableNo || !tableForm.seats}
          >
            {addTableMutation.isPending ? "Adding..." : "Add Table"}
          </button>
        </div>
      </Modal>

      {/* Edit Table Modal */}
      <Modal isOpen={!!editingTable} onClose={() => setEditingTable(null)} title="Edit Table">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Table Number (e.g. 1, A1, VIP-2)"
            className="bg-[#333] text-white p-3 rounded outline-none border border-transparent focus:border-yellow-500"
            value={tableForm.tableNo}
            onChange={(e) => setTableForm({ ...tableForm, tableNo: e.target.value })}
          />
          <input
            type="number"
            placeholder="Number of Seats"
            className="bg-[#333] text-white p-3 rounded outline-none border border-transparent focus:border-yellow-500"
            value={tableForm.seats}
            onChange={(e) => setTableForm({ ...tableForm, seats: e.target.value })}
          />
          <button
            onClick={() => editTableMutation.mutate({ tableId: editingTable._id, tableNo: tableForm.tableNo.trim(), seats: Number(tableForm.seats) })}
            className="bg-blue-600 text-white font-bold p-3 rounded hover:bg-blue-500 transition"
            disabled={editTableMutation.isPending || !tableForm.tableNo || !tableForm.seats}
          >
            {editTableMutation.isPending ? "Updating..." : "Update Table"}
          </button>
        </div>
      </Modal>
    </section>
  );
};

export default Tables;
