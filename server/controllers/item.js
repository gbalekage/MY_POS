const Item = require("../models/item");
const HttpError = require("../models/error"); 

const createItem = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      store,
      barcode,
      category,
      supplier,
    } = req.body;

    if (
      !name ||
      !price ||
      !stock ||
      !store ||
      !barcode ||
      !category ||
      !supplier
    ) {
      return next(new HttpError("Toutes le champ sont requis", 400));
    }

    const item = await Item.findOne({ barcode });
    if (item) {
      return next(
        new HttpError(
          "L'item existe deja, chaque item a un barcode Unique",
          400
        )
      );
    }

    const newItem = new Item({
      name,
      description,
      price,
      stock,
      barcode,
      store,
      category,
      supplier,
      createdBy: req.user.id,
      isActive: stock > 0,
      activityLogs: [
        {
          action: "Item created",
          performedBy: req.user.id,
          description: `Item créé avec un stock initial de ${stock}.`,
        },
      ],
    });

    const savedItem = await newItem.save();

    res.status(201).json({
      message: "Item créé avec succès.",
      item: savedItem,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'item:", error);
    return next(new HttpError("Erreur serveur.", 500));
  }
};

const updateItem = async (req, res, next) => {
  try {
    const itemId = req.params.id;
    const {
      name,
      description,
      price,
      stock,
      lowStock,
      store,
      category,
      supplier,
    } = req.body;

    const item = await Item.findById(itemId);

    if (!item) {
      return next(new HttpError("Item introuvable.", 404));
    }

    if (name) item.name = name;
    if (description) item.description = description;
    if (price !== undefined) item.price = price;
    if (stock !== undefined) item.stock = stock;
    if (lowStock !== undefined) item.lowStock = lowStock;
    if (store) item.store = store;
    if (category) item.category = category;
    if (supplier) item.supplier = supplier;

    // 🚨 Gestion auto de isActive
    if (stock !== undefined) {
      if (stock <= 0) {
        item.isActive = false;
      } else {
        item.isActive = true;
      }

      item.activityLogs.push({
        action: "Stock updated",
        performedBy: req.user.id,
        description: `Stock mis à jour à ${stock}.`,
      });
    }

    const updatedItem = await item.save();

    res.status(200).json({
      message: "Item mis à jour avec succès.",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'item:", error);
    return next(new HttpError("Erreur serveur.", 500));
  }
};

const getItems = async (req, res, next) => {
  try {
    const items = await Item.find().populate("store category supplier");

    res.status(200).json({ items });
  } catch (error) {
    console.error("Erreur lors de la récupération des items:", error);
    return next(new HttpError("Erreur serveur.", 500));
  }
};

const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "store category supplier"
    );

    if (!item) {
      return next(new HttpError("Item introuvable.", 404));
    }

    res.status(200).json({ item });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'item:", error);
    return next(new HttpError("Erreur serveur.", 500));
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const itemId = req.params.id;

    const item = await Item.findByIdAndDelete(itemId);

    if (!item) {
      return next(new HttpError("Item introuvable.", 404));
    }

    res.status(200).json({ message: "Item supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'item:", error);
    return next(new HttpError("Erreur serveur.", 500));
  }
};

module.exports = {
  createItem,
  updateItem,
  getItems,
  getItemById,
  deleteItem,
};
