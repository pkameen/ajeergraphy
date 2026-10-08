import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, push, onValue, remove } from "firebase/database";
import { motion } from "framer-motion";
import { 
  FiPackage, 
  FiDollarSign, 
  FiImage, 
  FiAlignLeft, 
  FiCheckCircle, 
  FiStar,
  FiPlus,
  FiX,
  FiCheck,
  FiTag,
  FiGrid
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

const AddProduct = () => {
  const [product, setProduct] = useState({
    productName: "",
    category: "",
    sellingPrice: "",
    description: "",
    status: "Available",
    featured: false,
    image: "",
  });

  const [categories, setCategories] = useState([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategoryLoading, setAddingCategoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch categories dynamically from Firebase
  useEffect(() => {
    const catRef = ref(db, "categories");
    const unsubscribe = onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loaded = Object.keys(data).map((key) => ({
          id: key,
          name: typeof data[key] === "string" ? data[key] : data[key].name || "",
        })).filter(c => c.name);

        setCategories(loaded);
      } else {
        setCategories([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({
      ...product,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Convert Image to Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProduct({ ...product, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new Category to Firebase
  const handleAddCategory = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error("Please enter a category name");
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.success(`Selected category "${trimmed}"`);
      setProduct(prev => ({ ...prev, category: trimmed }));
      setIsAddCategoryOpen(false);
      setNewCategoryName("");
      return;
    }

    setAddingCategoryLoading(true);
    try {
      const catRef = ref(db, "categories");
      await push(catRef, { name: trimmed, createdAt: Date.now() });
      
      setProduct(prev => ({ ...prev, category: trimmed }));
      toast.success(`Category "${trimmed}" added & selected!`);
      setNewCategoryName("");
      setIsAddCategoryOpen(false);
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
    setAddingCategoryLoading(false);
  };

  // Delete dynamic category from Firebase
  const handleDeleteCategory = async (catId, catName, e) => {
    e.stopPropagation();
    try {
      if (catId) {
        await remove(ref(db, `categories/${catId}`));
        toast.success(`Category "${catName}" removed`);
        if (product.category === catName) {
          setProduct(prev => ({ ...prev, category: "" }));
        }
      }
    } catch (error) {
      console.error("Failed to delete category", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !product.productName ||
      !product.category ||
      !product.sellingPrice
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const productRef = ref(db, "products");

      await push(productRef, {
        ...product,
        sellingPrice: Number(product.sellingPrice),
        createdAt: Date.now(),
      });

      toast.success("Product Added Successfully");

      setProduct({
        productName: "",
        category: "",
        sellingPrice: "",
        description: "",
        status: "Available",
        featured: false,
        image: "",
      });
    } catch (error) {
      toast.error("Failed to add product");
      console.log(error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <Toaster />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl font-bold text-[#111] tracking-tight">New Product</h1>
        <p className="text-gray-500 mt-2 font-medium">Add a new Product to your luxury collection.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white premium-shadow border border-gray-100 rounded-[30px] p-8 max-w-5xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Image Upload */}
          <div className="lg:col-span-4 space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Product Image</label>
            <div className="w-full aspect-[4/5] bg-gray-50 rounded-[20px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-gray-100 hover:border-[#D4AF37]/50 transition-all">
              {product.image ? (
                <img src={product.image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-400 gap-2">
                  <FiImage className="text-4xl" />
                  <span className="text-sm font-semibold">Upload Image</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            {product.image && (
              <button type="button" onClick={() => setProduct({...product, image: ""})} className="text-xs font-bold text-red-500 hover:text-red-600 w-full text-center mt-2">
                Remove Image
              </button>
            )}
          </div>

          {/* Right Column: Form Fields */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="md:col-span-2 relative group/input">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Product Name *</label>
              <div className="relative flex items-center">
                <FiPackage className="absolute left-4 text-gray-400 group-focus-within/input:text-[#D4AF37] transition-colors z-10" />
                <input type="text" name="productName" placeholder="e.g. Premium Calligraphy Art" value={product.productName} onChange={handleChange} className="w-full bg-gray-50/80 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4 pl-11" required />
              </div>
            </div>

            {/* INNOVATED SELECT COLLECTIONS & ADD CATEGORY */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiGrid className="text-[#D4AF37]" /> Select Collection / Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="bg-[#111] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#111] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md group"
                >
                  <FiPlus className="text-sm group-hover:rotate-90 transition-transform duration-200" />
                  <span>Add Category</span>
                </button>
              </div>

              {/* Interactive Category Pills */}
              <div className="bg-gray-50/90 p-5 rounded-2xl border border-gray-100/80 space-y-4">
                {categories.length === 0 ? (
                  <div className="py-6 text-center text-gray-500 font-medium text-xs border border-dashed border-gray-200 rounded-xl bg-white/60">
                    <p className="mb-2 text-gray-400">No categories created yet.</p>
                    <button
                      type="button"
                      onClick={() => setIsAddCategoryOpen(true)}
                      className="bg-[#111] text-[#D4AF37] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#D4AF37] hover:text-[#111] transition-all"
                    >
                      <FiPlus /> Add First Category
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {categories.map((cat) => {
                      const isSelected = product.category === cat.name;
                      return (
                        <button
                          key={cat.id || cat.name}
                          type="button"
                          onClick={() => setProduct({ ...product, category: cat.name })}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 relative ${
                            isSelected
                              ? "bg-[#111] text-[#D4AF37] shadow-lg shadow-black/20 ring-2 ring-[#D4AF37]/60 scale-[1.03]"
                              : "bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-300 border border-gray-200/80"
                          }`}
                        >
                          {isSelected && <FiCheck className="text-sm text-[#D4AF37]" />}
                          <span>{cat.name}</span>
                          <span
                            onClick={(e) => handleDeleteCategory(cat.id, cat.name, e)}
                            className="ml-1 opacity-50 hover:opacity-100 hover:text-red-400 transition-opacity p-0.5"
                            title="Remove Category"
                          >
                            <FiX className="text-xs" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selection Summary */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200/60 text-xs">
                  <span className="text-gray-400 font-medium">Selected Collection:</span>
                  <span className={`font-bold px-3 py-1 rounded-lg border text-xs transition-all ${
                    product.category 
                      ? "bg-[#111] text-[#D4AF37] border-[#111]" 
                      : "bg-white text-gray-400 border-gray-200 italic"
                  }`}>
                    {product.category || "No Collection Selected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Selling Price */}
            <div className="relative group/input">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Selling Price (₹) *</label>
              <div className="relative flex items-center">
                <FiDollarSign className="absolute left-4 text-gray-400 group-focus-within/input:text-[#D4AF37] transition-colors z-10" />
                <input type="number" min="0" name="sellingPrice" placeholder="0" value={product.sellingPrice} onChange={handleChange} className="w-full bg-gray-50/80 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4 pl-11" required />
              </div>
            </div>

            {/* Status */}
            <div className="relative group/input">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Status *</label>
              <div className="relative flex items-center">
                <FiCheckCircle className="absolute left-4 text-gray-400 group-focus-within/input:text-[#D4AF37] transition-colors z-10" />
                <select name="status" value={product.status} onChange={handleChange} className="w-full bg-gray-50/80 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4 pl-11 appearance-none cursor-pointer relative z-0" required>
                  <option value="Available">Available</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Product Description */}
            <div className="md:col-span-2 relative group/input">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Product Description</label>
              <div className="relative flex items-start">
                <FiAlignLeft className="absolute left-4 top-5 text-gray-400 group-focus-within/input:text-[#D4AF37] transition-colors z-10" />
                <textarea name="description" placeholder="Optional product description..." value={product.description} onChange={handleChange} rows="3" className="w-full bg-gray-50/80 hover:bg-gray-100/50 border border-transparent focus:bg-white focus:border-[#D4AF37]/40 rounded-2xl text-sm font-semibold text-[#111] outline-none transition-all p-4 pl-11 resize-none"></textarea>
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="md:col-span-2 flex items-center justify-between bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${product.featured ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-200 text-gray-500'}`}>
                  <FiStar className={product.featured ? "fill-current" : ""} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111]">Featured Product</p>
                  <p className="text-xs font-medium text-gray-500">Highlight this item in the premium collection.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="featured" checked={product.featured} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 pt-4">
              <button type="submit" disabled={loading} className="w-full sm:w-auto ml-auto bg-[#111] text-[#D4AF37] px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#D4AF37] hover:text-[#111] transition-colors shadow-lg shadow-black/10 disabled:opacity-70">
                {loading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : "Publish Product"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* ADD CATEGORY MODAL */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[30px] p-6 sm:p-8 w-full max-w-md relative premium-shadow border border-gray-100"
          >
            <button
              type="button"
              onClick={() => setIsAddCategoryOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-[#111] bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors"
            >
              <FiX className="text-lg" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center">
                <FiTag className="text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#111]">Add New Category</h3>
                <p className="text-xs text-gray-500 font-medium">Create a new collection category</p>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Luxury Abayas, Fragrances..."
                  className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#D4AF37] rounded-2xl text-sm font-semibold text-[#111] p-4 outline-none transition-all"
                  autoFocus
                  required
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Quick Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["Abayas", "Hijabs", "Kimono", "Jewelry", "Fragrances", "Calligraphy"].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setNewCategoryName(sugg)}
                      className="text-[11px] font-semibold bg-gray-100 text-gray-600 hover:bg-[#D4AF37]/20 hover:text-[#111] px-2.5 py-1 rounded-lg transition-colors"
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold hover:bg-gray-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCategoryLoading}
                  className="flex-1 bg-[#111] text-[#D4AF37] py-3.5 rounded-2xl font-bold hover:bg-[#D4AF37] hover:text-[#111] transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {addingCategoryLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Save Category"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;