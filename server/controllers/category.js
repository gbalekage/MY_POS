const Category = require("../models/category");
const HttpError = require("../models/error");

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return next(new HttpError("Le nom de la catégorie est requis.", 422));
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) return next(new HttpError("Une catégorie avec ce nom existe déjà.", 409));
    const category = new Category({
      name: name.trim(),
      description,
      activityLogs: [{
        action: "CREATE_CATEGORY",
        description: `Catégorie ${name} créée.`,
        user: req.user.id,
      }],
    });
    await category.save();
    res.status(201).json({ message: "Catégorie créée avec succès.", category });
  } catch (error) {
    console.error("Erreur création catégorie:", error);
    next(new HttpError("Erreur serveur lors de la création.", 500));
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Erreur récupération catégories:", error);
    next(new HttpError("Erreur serveur lors de la récupération.", 500));
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return next(new HttpError("Catégorie non trouvée.", 404));
    res.status(200).json({ category });
  } catch (error) {
    console.error("Erreur récupération catégorie:", error);
    next(new HttpError("Erreur serveur lors de la récupération.", 500));
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const category = await Category.findById(id);
    if (!category) return next(new HttpError("Catégorie non trouvée.", 404));
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    category.activityLogs.push({
      action: "UPDATE_CATEGORY",
      description: `Catégorie mise à jour.`,
      user: req.user.id,
    });
    await category.save();
    res.status(200).json({ message: "Catégorie mise à jour avec succès.", category });
  } catch (error) {
    console.error("Erreur mise à jour catégorie:", error);
    next(new HttpError("Erreur serveur lors de la mise à jour.", 500));
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) return next(new HttpError("Catégorie non trouvée.", 404));
    res.status(200).json({ message: "Catégorie supprimée avec succès." });
  } catch (error) {
    console.error("Erreur suppression catégorie:", error);
    next(new HttpError("Erreur serveur lors de la suppression.", 500));
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
