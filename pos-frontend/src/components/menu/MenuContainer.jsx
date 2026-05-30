import React, { useState, useEffect } from "react";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMenu, addCategory, addItem, updateCategory, deleteCategory, updateItem, deleteItem } from "../../https";
import Modal from "../shared/Modal";
import { useSnackbar } from "notistack";

const MenuContainer = ({ isAdminMode }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [itemCounts, setItemCounts] = useState({}); // Per-item quantity map: { [itemId]: count }
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  // Modal Form States
  const [categoryForm, setCategoryForm] = useState({ name: "", bgColor: "#1a1a1a", icon: "🍽️" });
  const [itemForm, setItemForm] = useState({ name: "", price: "", categoryId: "", image: "" });

  // Edit/Delete States
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch Menu Data
  const { data: menuData, isLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const res = await getMenu();
      return res.data.data;
    }
  });

  // Set initial selected category
  useEffect(() => {
    if (menuData && menuData.length > 0 && !selectedCategory) {
      setSelectedCategory(menuData[0]);
    } else if (menuData && selectedCategory) {
      // Update selected category reference if data changes (e.g. invalidation)
      const updated = menuData.find(c => c.id === selectedCategory.id);
      if (updated) setSelectedCategory(updated);
    }
  }, [menuData, selectedCategory]);

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["menu"]);
      setIsAddCategoryOpen(false);
      setCategoryForm({ name: "", bgColor: "#1a1a1a", icon: "🍽️" });
      enqueueSnackbar("Category added!", { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || "Failed", { variant: "error" })
  });

  const updateCategoryMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["menu"]);
      setEditingCategory(null);
      setCategoryForm({ name: "", bgColor: "#1a1a1a", icon: "🍽️" });
      enqueueSnackbar("Category updated!", { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || "Failed", { variant: "error" })
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["menu"]);
      setSelectedCategory(null); // Reset selection
      enqueueSnackbar("Category deleted!", { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || "Failed", { variant: "error" })
  });

  const createItemMutation = useMutation({
    mutationFn: addItem,
    onSuccess: () => {
      queryClient.invalidateQueries(["menu"]);
      setIsAddItemOpen(false);
      setItemForm({ name: "", price: "", categoryId: "", image: "" });
      enqueueSnackbar("Item added!", { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || "Failed", { variant: "error" })
  });

  const updateItemMutation = useMutation({
    mutationFn: updateItem,
    onSuccess: () => {
      queryClient.invalidateQueries(["menu"]);
      setEditingItem(null);
      setItemForm({ name: "", price: "", categoryId: "", image: "" });
      enqueueSnackbar("Item updated!", { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || "Failed", { variant: "error" })
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries(["menu"]);
      enqueueSnackbar("Item deleted!", { variant: "success" });
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || "Failed", { variant: "error" })
  });


  // Handlers
  const increment = (id) => {
    setItemCounts((prev) => {
      const current = prev[id] || 0;
      if (current >= 10) return prev;
      return { ...prev, [id]: current + 1 };
    });
  };

  const decrement = (id) => {
    setItemCounts((prev) => {
      const current = prev[id] || 0;
      if (current <= 0) return prev;
      return { ...prev, [id]: current - 1 };
    });
  };

  const handleAddToCart = (item) => {
    const count = itemCounts[item.id] || 0;
    if (count === 0) {
      enqueueSnackbar("Please select quantity first", { variant: "warning" });
      return;
    }

    const { name, price } = item;
    const newObj = {
      id: new Date().toISOString(),
      name,
      pricePerQuantity: price,
      quantity: count,
      price: price * count
    };

    dispatch(addItems(newObj));
    setItemCounts((prev) => {
      const updated = { ...prev };
      delete updated[item.id];
      return updated;
    });
    enqueueSnackbar("Added to cart", { variant: "success" });
  };

  const handleEditCategory = (cat, e) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, bgColor: cat.bgColor, icon: cat.icon });
  };

  const handleDeleteCategory = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this category and all its items?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({ name: item.name, price: item.price, categoryId: item.category, image: item.image || "" });
  };

  const handleDeleteItem = (id) => {
    if (window.confirm("Delete this item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  const handleAddItemClick = () => {
    if (!selectedCategory) {
      enqueueSnackbar("Please select or add a category first!", { variant: "warning" });
      return;
    }
    setItemForm({ name: "", price: "", categoryId: selectedCategory.id, image: "" });
    setIsAddItemOpen(true);
  };


  if (isLoading) return <div className="text-white p-10">Loading menu...</div>;

  return (
    <>
      {/* Categories Horizontal Tabs */}
      <div className="flex flex-col w-full h-full">

        {/* Header with Add Category */}
        <div className="flex justify-between items-center px-4 sm:px-10 pt-4 pb-2">
          <h2 className="text-gray-400 font-semibold text-md sm:text-lg">Menu Categories</h2>
          {isAdminMode && (
            <button
              onClick={() => setIsAddCategoryOpen(true)}
              className="bg-yellow-500 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center gap-2 font-bold hover:bg-yellow-400 transition text-xs sm:text-sm"
            >
              <FaPlus /> Add Category
            </button>
          )}
        </div>

        {/* Horizontal Category Pills */}
        <div className="px-4 sm:px-10 pb-4">
          <div className="flex flex-wrap gap-2 sm:gap-3 pb-2">
            {menuData?.map((menu) => (
              <button
                key={menu.id}
                className={`
                  flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full whitespace-nowrap
                  font-semibold transition-all duration-200 relative group text-xs sm:text-sm
                  ${selectedCategory?.id === menu.id
                    ? 'bg-yellow-500 text-black shadow-lg scale-105'
                    : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333] hover:scale-102'
                  }
                `}
                onClick={() => {
                  setSelectedCategory(menu);
                  setItemCounts({});
                }}
              >
                <span className="text-lg">{menu.icon}</span>
                <span>{menu.name}</span>
                <span className="text-[10px] sm:text-xs opacity-70">({menu.items?.length || 0})</span>

                {isAdminMode && (
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={(e) => handleEditCategory(menu, e)}
                      className="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 shadow"
                    >
                      <FaEdit size={10} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCategory(menu.id, e)}
                      className="p-1.5 bg-red-600 rounded-full text-white hover:bg-red-500 shadow"
                    >
                      <FaTrash size={10} />
                    </button>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-[#2a2a2a] border-t-2" />

        {/* Items Header */}
        <div className="flex justify-between items-center px-4 sm:px-10 py-4">
          <h2 className="text-white font-bold text-lg sm:text-xl">
            {selectedCategory ? selectedCategory.name : "Select a Category"}
          </h2>
          {selectedCategory && isAdminMode && (
            <button
              onClick={handleAddItemClick}
              className="bg-[#2e4a40] text-[#02ca3a] px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center gap-2 font-bold hover:bg-[#3d6356] transition text-xs sm:text-sm"
            >
              <FaPlus /> Add Item
            </button>
          )}
        </div>

        {/* Items Grid - Modern Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 px-4 sm:px-10 py-2 w-full overflow-y-auto scrollbar-hide pb-6">
          {selectedCategory?.items?.map((item) => (
            <div
              key={item.id}
              className="flex flex-col bg-gradient-to-br from-[#252525] to-[#1a1a1a] rounded-2xl p-5 hover:shadow-2xl hover:scale-102 transition-all duration-300 relative group border border-[#333] hover:border-yellow-500"
            >
              {/* Admin Edit/Delete Buttons */}
              {isAdminMode && (
                <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 shadow-lg"
                  >
                    <FaEdit size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-500 shadow-lg"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              )}

              {/* Item Icon/Emoji Placeholder */}
              <div className="w-full h-32 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl flex items-center justify-center mb-4 border border-yellow-500/20">
                <span className="text-6xl opacity-80">{selectedCategory.icon}</span>
              </div>

              {/* Item Name */}
              <h3 className="text-white font-bold text-lg mb-2 truncate" title={item.name}>
                {item.name}
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-yellow-500 font-bold text-2xl">₹{item.price}</span>
                <span className="text-gray-500 text-sm">per item</span>
              </div>

              {/* Quantity Selector & Add to Cart */}
              {!isAdminMode && (
                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex items-center bg-[#1f1f1f] rounded-lg overflow-hidden border border-[#333]">
                    <button
                      onClick={() => decrement(item.id)}
                      className="text-yellow-500 px-3 py-2 hover:bg-[#2a2a2a] transition font-bold"
                    >
                      −
                    </button>
                    <span className="text-white px-4 py-2 min-w-[40px] text-center font-semibold">
                      {itemCounts[item.id] || 0}
                    </span>
                    <button
                      onClick={() => increment(item.id)}
                      className="text-yellow-500 px-3 py-2 hover:bg-[#2a2a2a] transition font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded-lg flex justify-center items-center gap-2 transition shadow-lg hover:shadow-xl"
                  >
                    <FaShoppingCart size={14} />
                    Add
                  </button>
                </div>
              )}
            </div>
          ))}

          {(!selectedCategory || selectedCategory.items?.length === 0) && (
            <div className="col-span-3 text-center text-gray-500 py-20">
              <p className="text-xl">No items found in this category.</p>
              {isAdminMode && selectedCategory && (
                <button
                  onClick={handleAddItemClick}
                  className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-500 transition"
                >
                  Add First Item
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}

      {/* Add Category Modal */}
      <Modal isOpen={isAddCategoryOpen} onClose={() => setIsAddCategoryOpen(false)} title="Add New Category">
        <div className="flex flex-col gap-4">
          <input
            type="text" placeholder="Category Name"
            className="bg-[#333] text-white p-3 rounded outline-none border border-transparent focus:border-yellow-500"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              type="color"
              className="bg-transparent h-12 w-12 cursor-pointer"
              value={categoryForm.bgColor}
              onChange={(e) => setCategoryForm({ ...categoryForm, bgColor: e.target.value })}
            />
            <input
              type="text" placeholder="Icon (emoji)"
              className="bg-[#333] text-white p-3 rounded outline-none flex-1"
              value={categoryForm.icon}
              onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
            />
          </div>
          <button
            onClick={() => createCategoryMutation.mutate(categoryForm)}
            className="bg-yellow-500 text-black font-bold p-3 rounded hover:bg-yellow-400"
            disabled={createCategoryMutation.isPending}
          >
            {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
          </button>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} title="Edit Category">
        <div className="flex flex-col gap-4">
          <input
            type="text" placeholder="Category Name"
            className="bg-[#333] text-white p-3 rounded outline-none border border-transparent focus:border-yellow-500"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              type="color"
              className="bg-transparent h-12 w-12 cursor-pointer"
              value={categoryForm.bgColor}
              onChange={(e) => setCategoryForm({ ...categoryForm, bgColor: e.target.value })}
            />
            <input
              type="text" placeholder="Icon (emoji)"
              className="bg-[#333] text-white p-3 rounded outline-none flex-1"
              value={categoryForm.icon}
              onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
            />
          </div>
          <button
            onClick={() => updateCategoryMutation.mutate({ id: editingCategory.id, ...categoryForm })}
            className="bg-blue-600 text-white font-bold p-3 rounded hover:bg-blue-500"
          >
            Update Category
          </button>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} title="Add New Item">
        <div className="flex flex-col gap-4">
          <input
            type="text" placeholder="Item Name"
            className="bg-[#333] text-white p-3 rounded outline-none border border-transparent focus:border-yellow-500"
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
          />
          <input
            type="number" placeholder="Price (₹)"
            className="bg-[#333] text-white p-3 rounded outline-none"
            value={itemForm.price}
            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
          />
          <div className="flex flex-col gap-2">
            <input
              type="text" placeholder="Image URL (optional)"
              className="bg-[#333] text-white p-3 rounded outline-none border border-transparent focus:border-yellow-500"
              value={itemForm.image}
              onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
            />
            {itemForm.image && (
              <div className="relative w-24 h-24 bg-[#222] rounded overflow-hidden">
                <img
                  src={itemForm.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>
          <button
            onClick={() => createItemMutation.mutate(itemForm)}
            className="bg-green-600 text-white font-bold p-3 rounded hover:bg-green-500"
            disabled={createItemMutation.isPending}
          >
            {createItemMutation.isPending ? "Adding..." : "Add Item"}
          </button>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Item">
        <div className="flex flex-col gap-4">
          <input
            type="text" placeholder="Item Name"
            className="bg-[#333] text-white p-3 rounded outline-none border border-transparent focus:border-yellow-500"
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
          />
          <input
            type="number" placeholder="Price (₹)"
            className="bg-[#333] text-white p-3 rounded outline-none"
            value={itemForm.price}
            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
          />
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm">Food Image</label>
            <input
              type="text" placeholder="Image URL"
              className="bg-[#333] text-white p-3 rounded outline-none border border-transparent focus:border-yellow-500"
              value={itemForm.image}
              onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
            />
            {itemForm.image && (
              <div className="relative w-32 h-32 bg-[#222] rounded overflow-hidden">
                <img
                  src={itemForm.image}
                  alt="Food Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>
          <button
            onClick={() => updateItemMutation.mutate({ id: editingItem.id, ...itemForm })}
            className="bg-blue-600 text-white font-bold p-3 rounded hover:bg-blue-500"
          >
            Update Item
          </button>
        </div>
      </Modal>
    </>
  );
};

export default MenuContainer;
