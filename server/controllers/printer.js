const HttpError = require("../models/error");
const Printer = require("../models/printer");
const { printTestPage } = require("../services/printer");

const addPrinter = async (req, res, next) => {
  try {
    const { name, type, ip, port, isDefault } = req.body;

    if (!name || !type) {
      return next(
        new HttpError("Le nom et le type de l'imprimante sont requis", 400)
      );
    }

    if (type === "network" && !ip) {
      return next(
        new HttpError(
          "L'adresse IP est requise pour les imprimantes réseau",
          400
        )
      );
    }

    // Si c'est l'imprimante par défaut, on désactive les autres
    if (isDefault) {
      await Printer.updateMany({ isDefault: true }, { isDefault: false });
    }

    const newPrinter = new Printer({
      name,
      type,
      ip,
      port,
      isDefault: !!isDefault, // assure que c'est un booléen
    });

    const savedPrinter = await newPrinter.save();

    res.status(201).json({
      message: "Imprimante ajoutée avec succès !",
      printer: savedPrinter,
    });
  } catch (error) {
    return next(new HttpError(error.message || "Erreur serveur", 500));
  }
};

const getPrinters = async (req, res, next) => {
  try {
    const printers = await Printer.find();
    res.status(200).json(printers);
  } catch (error) {
    console.error("Erreur mise à jour fournisseur:", error);
    next(new HttpError("Erreur serveur lors de la mise à jour.", 500));
  }
};

const getPrinterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const printer = await Printer.findById(id);
    if (!printer) {
      return next(new HttpError("L'imprimante n'est pas trouve.", 404));
    }
    res.status(200).json(printer);
  } catch (error) { }
};

const testPrinter = async (req, res) => {
  try {
    const { printerId } = req.params;

    const printer = await Printer.findById(printerId);
    if (!printer) {
      return res.status(404).json({ message: "Imprimante non connecté." });
    }

    await printTestPage(printer);

    res.status(200).json({ message: "Test print sent successfully." });
  } catch (error) {
    console.error("Error testing printer:", error);
    res
      .status(500)
      .json({ message: "Failed to test printer.", error: error.message });
  }
};

const updatePrinter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, ip, port, isDefault } = req.body;

    const printer = await Printer.findById(id);
    if (!printer) {
      return next(new HttpError("Imprimante non trouvée.", 404));
    }

    if (name) printer.name = name;
    if (type) printer.type = type;
    if (typeof ip !== 'undefined') printer.ip = ip;
    if (typeof port !== 'undefined') printer.port = port;
    if (typeof isDefault !== 'undefined') printer.isDefault = isDefault;

    // Si c'est l'imprimante par défaut, on désactive les autres
    if (isDefault) {
      await Printer.updateMany({ _id: { $ne: id }, isDefault: true }, { isDefault: false });
    }

    const updatedPrinter = await printer.save();
    res.status(200).json({ message: "Imprimante mise à jour avec succès !", printer: updatedPrinter });
  } catch (error) {
    return next(new HttpError(error.message || "Erreur serveur", 500));
  }
};

const deletePrinter = async (req, res, next) => {
  try {
    const { id } = req.params

    const printer = await Printer.findByIdAndDelete(id)
    if (!printer) {
      return next(new HttpError("Imprimente introuvable", 404))
    }

    res.status(200).json({ message: "imprimente supprimer" })

  } catch (error) {
    return next(new HttpError(error))
  }
}

module.exports = { addPrinter, getPrinters, getPrinterById, testPrinter, updatePrinter, deletePrinter };
