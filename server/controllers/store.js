const Store = require("../models/store");
const HttpError = require("../models/error");

const addStore = async (req, res, next) => {
  try {
    const { name, printer } = req.body;

    if (!name) {
      return next(new HttpError("Le nom du magasin est obligatoire.", 422));
    }

    const newStore = new Store({
      name,
      printer,
    });

    const savedStore = await newStore.save();

    res.status(201).json({
      message: "Magasin ajouté avec succès.",
      store: savedStore,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du magasin :", error);
    return next(new HttpError(error));
  }
};

const getStores = async (req, res) => {
  try {
    const stores = await Store.find().populate("printer");
    res.status(200).json({ stores });
  } catch (error) {
    console.error("Erreur lors de la récupération des magasins :", error);
    return next(new HttpError(error));
  }
};

const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findById(id);

    if (!store) {
      return next(new HttpError("Magasin introuvable.", 404));
    }

    res.status(200).json(store);
  } catch (error) {
    console.error("Erreur lors de la récupération du magasin :", error);
    return next(new HttpError(error));
  }
};

const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, printer } = req.body;

    const store = await Store.findById(id);

    if (!store) {
      return next(new HttpError("Magasin introuvable.", 404));
    }

    if (name !== undefined) store.name = name;
    if (printer !== undefined) store.printer = printer;

    const updatedStore = await store.save();

    res.status(200).json({
      message: "Magasin mis à jour avec succès.",
      store: updatedStore,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du magasin :", error);
    return next(new HttpError(error));
  }
};

const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByIdAndDelete(id);
    if (!store) {
      return next(new HttpError("Magasin introuvable.", 404));
    }

    res.status(200).json({ message: "Magasin supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression du magasin :", error);
    return next(new HttpError(error));
  }
};

module.exports = {
  addStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
};
