import React, { useState, useEffect, useMemo, useRef } from "react";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart, FaPlus, FaEdit, FaTrash, FaSearch, FaTimes } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMenu, addCategory, addItem, updateCategory, deleteCategory, updateItem, deleteItem } from "../../https";
import Modal from "../shared/Modal";
import { useSnackbar } from "notistack";
import { sortMenuCategoriesAndItems } from "../../utils/menuSorter";

const MenuContainer = ({ isAdminMode }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [itemCounts, setItemCounts] = useState({}); // Per-item quantity map: { [itemId]: count }
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState(null);

  // Modal Form States
  const [categoryForm, setCategoryForm] = useState({ name: "", bgColor: "#1a1a1a", icon: "🍽️" });
  const [itemForm, setItemForm] = useState({ name: "", price: "", categoryId: "", image: "" });

  // Edit/Delete States
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch Menu Data
  const { data: rawMenuData, isLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const res = await getMenu();
      return res.data.data;
    }
  });

  // Sort categories and dishes according to restaurant structure
  const menuData = useMemo(() => {
    if (!rawMenuData) return [];
    return sortMenuCategoriesAndItems(rawMenuData);
  }, [rawMenuData]);

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

  // Search & Suggestions
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !menuData) return [];
    const q = searchQuery.trim().toLowerCase();
    const results = [];
    menuData.forEach((cat) => {
      (cat.items || []).forEach((item) => {
        if (item.name.toLowerCase().includes(q)) {
          results.push({
            ...item,
            _categoryName: cat.name,
            _categoryIcon: cat.icon,
            _categoryId: cat.id
          });
        }
      });
    });
    return results;
  }, [searchQuery, menuData]);

  const handleSelectSuggestedItem = (item) => {
    // 1. Find the category this item belongs to and switch to it
    const targetCat = menuData.find(c => c.id === item._categoryId || c.id === item.category || c.items?.some(i => i.id === item.id));
    if (targetCat) {
      setSelectedCategory(targetCat);
      setItemCounts({});
    }

    // 2. Clear query and close dropdown
    setSearchQuery("");
    setIsDropdownOpen(false);

    // 3. Highlight the item
    setHighlightedItemId(item.id);

    // 4. Scroll smoothly to the item on the page
    setTimeout(() => {
      const el = document.getElementById(`menu-item-${item.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 200);

    // 5. Remove highlight after 2.5 seconds
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 2500);
  };

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
      menuItemId: item.id || item._id,
      id: item.id || item._id || new Date().toISOString(),
      name,
      pricePerQuantity: Number(price),
      quantity: Number(count),
      price: Number(price) * Number(count),
      notes: ""
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
      <div className="flex flex-col w-full">

        {/* Sticky Categories Bar */}
        <div className="sticky top-0 bg-[#1f1f1f] z-20 pb-3 pt-2 px-2 sm:px-6 border-b border-[#2a2a2a]/80 shadow-md">
          {/* Header with Search + Add Category */}
          <div className="flex justify-between items-center gap-2 pb-2">
            <h2 className="text-gray-400 font-semibold text-sm sm:text-base flex-shrink-0">Menu Categories</h2>
            <div className="flex items-center gap-2">
              {/* Search Bar with Suggestions Dropdown */}
              {!isAdminMode && (
                <div className="relative flex items-center" ref={searchDropdownRef}>
                  <FaSearch className="absolute left-3 text-gray-500 text-xs pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onFocus={() => {
                      if (searchQuery.trim()) setIsDropdownOpen(true);
                    }}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    className="bg-[#2a2a2a] text-white text-xs sm:text-sm pl-8 pr-8 py-1.5 sm:py-2 rounded-lg outline-none border border-[#3a3a3a] focus:border-yellow-500/60 transition-all w-[150px] sm:w-[240px] md:w-[280px] placeholder-gray-500 shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setIsDropdownOpen(false);
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-2 text-gray-400 hover:text-white transition"
                    >
                      <FaTimes size={12} />
                    </button>
                  )}

                  {/* Dropdown Suggestions */}
                  {isDropdownOpen && searchQuery.trim().length > 0 && (
                    <div className="absolute top-full right-0 mt-2 w-[280px] sm:w-[340px] md:w-[380px] bg-[#222] border border-[#3a3a3a] rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        <div className="py-2">
                          <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#2e2e2e] flex justify-between items-center">
                            <span>Suggestions</span>
                            <span className="text-yellow-500 font-bold">{searchResults.length} found</span>
                          </div>
                          {searchResults.slice(0, 15).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectSuggestedItem(item)}
                              className="flex items-center justify-between px-3 py-2.5 hover:bg-[#2e2e2e] cursor-pointer transition border-b border-[#2a2a2a]/40 last:border-0 group"
                            >
                              <div className="min-w-0 flex-1 pr-3">
                                <h4 className="text-white text-xs sm:text-sm font-semibold truncate group-hover:text-yellow-400 transition-colors">
                                  {item.name}
                                </h4>
                                <p className="text-[11px] text-gray-400 truncate">
                                  {item._categoryName}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0 flex items-center gap-2">
                                <span className="text-yellow-400 font-bold text-xs sm:text-sm">₹{item.price}</span>
                                <span className="text-[10px] text-gray-400 group-hover:text-white bg-[#1a1a1a] px-2 py-1 rounded transition font-semibold">
                                  Go →
                                </span>
                              </div>
                            </div>
                          ))}
                          {searchResults.length > 15 && (
                            <div className="px-3 py-1.5 text-center text-[11px] text-gray-500 bg-[#1a1a1a]">
                              Showing first 15 of {searchResults.length} matches
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-400 text-xs">
                          <p>No dishes matching "{searchQuery}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isAdminMode && (
                <button
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="bg-yellow-500 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center gap-2 font-bold hover:bg-yellow-400 transition text-xs sm:text-sm active:scale-95"
                >
                  <FaPlus /> Add Category
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Category Pills */}
          <div className="flex flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-1 pt-1 w-full">
            {menuData?.map((menu) => (
              <button
                key={menu.id}
                className={`
                  flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full whitespace-nowrap
                  font-semibold transition-all duration-200 relative group text-xs sm:text-sm flex-shrink-0
                  ${selectedCategory?.id === menu.id
                    ? 'bg-yellow-500 text-black shadow-lg scale-105'
                    : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333] hover:text-white'
                  }
                `}
                onClick={() => {
                  setSelectedCategory(menu);
                  setItemCounts({});
                }}
              >
                <span className="text-base sm:text-lg">{menu.icon}</span>
                <span>{menu.name}</span>
                <span className="text-[10px] sm:text-xs opacity-70">({menu.items?.length || 0})</span>

                {isAdminMode && (
                  <div className="flex gap-1 ml-1 sm:ml-2">
                    <button
                      onClick={(e) => handleEditCategory(menu, e)}
                      className="p-1 bg-blue-600 rounded-full text-white hover:bg-blue-500 shadow"
                      title="Edit Category"
                    >
                      <FaEdit size={9} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCategory(menu.id, e)}
                      className="p-1 bg-red-600 rounded-full text-white hover:bg-red-500 shadow"
                      title="Delete Category"
                    >
                      <FaTrash size={9} />
                    </button>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Items Section */}
        <div className="px-2 sm:px-6 pt-4">
          {/* Items Header */}
          <div className="flex justify-between items-center pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-white font-bold text-lg sm:text-2xl">
                {selectedCategory ? selectedCategory.name : "Select a Category"}
              </h2>
              {selectedCategory && (
                <span className="text-xs text-gray-400 bg-[#2a2a2a] px-2.5 py-1 rounded-full font-medium">
                  {selectedCategory.items?.length || 0} {selectedCategory.items?.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            {selectedCategory && isAdminMode && (
              <button
                onClick={handleAddItemClick}
                className="bg-[#2e4a40] text-[#02ca3a] px-3 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center gap-2 font-bold hover:bg-[#3d6356] transition text-xs sm:text-sm active:scale-95"
              >
                <FaPlus /> Add Item
              </button>
            )}
          </div>

          {/* Items Grid */}
          <div
            className="w-full"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {selectedCategory?.items?.map((item) => (
              <div
                key={item.id}
                id={`menu-item-${item.id}`}
                className={`flex flex-col bg-gradient-to-br from-[#252525] to-[#1a1a1a] rounded-2xl p-4 sm:p-5 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative group border ${
                  highlightedItemId === item.id
                    ? "border-yellow-400 ring-4 ring-yellow-400/40 scale-[1.03] shadow-yellow-500/20 shadow-2xl"
                    : "border-[#333] hover:border-yellow-500/60"
                }`}
              >
                {/* Admin Edit/Delete Buttons */}
                {isAdminMode && (
                  <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 shadow-lg active:scale-95 transition"
                      title="Edit Item"
                    >
                      <FaEdit size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-500 shadow-lg active:scale-95 transition"
                      title="Delete Item"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                )}

                  {/* Item Name */}
                  <h3 className={`text-white font-bold text-base sm:text-lg mb-1.5 leading-snug ${isAdminMode ? "pr-16" : ""}`} title={item.name}>
                    {item.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-yellow-500 font-bold text-xl sm:text-2xl">₹{item.price}</span>
                    <span className="text-gray-500 text-xs sm:text-sm">per item</span>
                  </div>

                {/* Quantity Selector & Add to Cart */}
                {!isAdminMode && (
                  <div className="flex items-center gap-2 sm:gap-3 mt-auto">
                    <div className="flex items-center bg-[#1f1f1f] rounded-lg overflow-hidden border border-[#333]">
                      <button
                        onClick={() => decrement(item.id)}
                        className="text-yellow-500 px-2.5 sm:px-3 py-2 hover:bg-[#2a2a2a] transition font-bold"
                      >
                        −
                      </button>
                      <span className="text-white px-2 sm:px-4 py-2 min-w-[32px] sm:min-w-[40px] text-center font-semibold text-sm">
                        {itemCounts[item.id] || 0}
                      </span>
                      <button
                        onClick={() => increment(item.id)}
                        className="text-yellow-500 px-2.5 sm:px-3 py-2 hover:bg-[#2a2a2a] transition font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-3 rounded-lg flex justify-center items-center gap-2 transition shadow-lg hover:shadow-xl text-xs sm:text-sm active:scale-95"
                    >
                      <FaShoppingCart size={14} />
                      Add
                    </button>
                  </div>
                )}
              </div>
            ))}

            {(!selectedCategory || selectedCategory.items?.length === 0) && (
              <div className="col-span-full text-center text-gray-500 py-20">
                <p className="text-xl">No items found in this category.</p>
                {isAdminMode && selectedCategory && (
                  <button
                    onClick={handleAddItemClick}
                    className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-500 transition active:scale-95"
                  >
                    Add First Item
                  </button>
                )}
              </div>
            )}
          </div>
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
