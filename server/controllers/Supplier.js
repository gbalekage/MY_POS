const Supplier = require("../models/Supplier");
const HttpError = require("../models/error");

// Create a new supplier
const createSupplier = async (req, res, next) => {
  try {
    const { name, phone, email, address, notes } = req.body;

    if (!name) {
      return next(new HttpError("Le nom du fournisseur est requis.", 422));
    }

    const existingSupplier = await Supplier.findOne({ name: name.trim() });
    if (existingSupplier) {
      return next(
        new HttpError("Un fournisseur avec ce nom existe déjà.", 409)
      );
    }

    const supplier = new Supplier({
      name: name.trim(),
      phone,
      email,
      address,
      notes,
      activityLogs: [
        {
          action: "CREATE_SUPPLIER",
          description: `Fournisseur ${name} créé.`,
          user: req.user.id,
        },
      ],
    });

    await supplier.save();

    res
      .status(201)
      .json({ message: "Fournisseur créé avec succès.", supplier });
  } catch (error) {
    console.error("Erreur création fournisseur:", error);
    next(new HttpError("Erreur serveur lors de la création.", 500));
  }
};

// Get all suppliers
const getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.status(200).json({ suppliers });
  } catch (error) {
    console.error("Erreur récupération fournisseurs:", error);
    next(new HttpError("Erreur serveur lors de la récupération.", 500));
  }
};

// Get supplier by ID
const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return next(new HttpError("Fournisseur non trouvé.", 404));
    }

    res.status(200).json({ supplier });
  } catch (error) {
    console.error("Erreur récupération fournisseur:", error);
    next(new HttpError("Erreur serveur lors de la récupération.", 500));
  }
};

// Update a supplier
const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, notes, isActive } = req.body;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return next(new HttpError("Fournisseur non trouvé.", 404));
    }

    if (name) supplier.name = name.trim();
    if (phone !== undefined) supplier.phone = phone;
    if (email !== undefined) supplier.email = email.toLowerCase();
    if (address !== undefined) supplier.address = address;
    if (notes !== undefined) supplier.notes = notes;
    if (isActive !== undefined) supplier.isActive = isActive;

    supplier.activityLogs.push({
      action: "UPDATE_SUPPLIER",
      description: `Fournisseur mis à jour.`,
      user: req.user.id,
    });

    await supplier.save();

    res
      .status(200)
      .json({ message: "Fournisseur mis à jour avec succès.", supplier });
  } catch (error) {
    console.error("Erreur mise à jour fournisseur:", error);
    next(new HttpError("Erreur serveur lors de la mise à jour.", 500));
  }
};

// Delete a supplier
const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      return next(new HttpError("Fournisseur non trouvé.", 404));
    }

    res.status(200).json({ message: "Fournisseur supprimé avec succès." });
  } catch (error) {
    console.error("Erreur suppression fournisseur:", error);
    next(new HttpError("Erreur serveur lors de la suppression.", 500));
  }
};

module.exports = {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
};
