const Table = require("../models/tables");
const HttpError = require("../models/error");

const addMultipleTables = async (req, res, next) => {
  try {
    const { numberOfTables } = req.body;

    if (
      !numberOfTables ||
      typeof numberOfTables !== "number" ||
      numberOfTables <= 0
    ) {
      return next(
        new HttpError(
          "Veuillez fournir un nombre valide de tables à ajouter.",
          422
        )
      );
    }

    const lastTable = await Table.findOne().sort({ tableNumber: -1 });

    let lastTableNumber = lastTable ? lastTable.tableNumber : 0;

    const newTables = [];

    for (let i = 1; i <= numberOfTables; i++) {
      lastTableNumber += 1;

      const table = new Table({
        tableNumber: lastTableNumber,
        activityLogs: [
          {
            action: "CREATE_MULTIPLE_TABLES",
            description: `Table ${lastTableNumber} ajoutée automatiquement.`,
            user: req.user.id,
          },
        ],
      });

      newTables.push(table);
    }

    const createdTables = await Table.insertMany(newTables);

    res.status(201).json({
      message: `${createdTables.length} table(s) créée(s) automatiquement avec succès.`,
      tables: createdTables,
    });
  } catch (error) {
    console.error(
      "Erreur lors de l'ajout automatique de plusieurs tables:",
      error
    );
    return next(new HttpError(error, 500));
  }
};

const getTableById = async (req, res, next) => {
  try {
    const id = req.params
    const table = await Table.findById(id).populate("items")
    if (!table) {
      return next(new HttpError("Table non trouve", 404))
    }
    res.status(200).json(table)
  } catch (error) {
    console.log("Error lors de la recuperation de la table: ", table)
  }
}

const getTbales = async (req, res, next) => {
  try {
    const tables = await Table.find().populate("assignedServer").populate("currentOrder");

    // if (!tables || tables.length === 0) {
    //   return next(new HttpError("Aucune table trouvée.", 404));
    // }

    res.status(200).json({ tables });
  } catch (error) {
    console.error("Erreur lors de la récupération des tables:", error);
    return next(new HttpError(error, 500));
  }
};

const updateTable = async (req, res, next) => {
  try {
    const { tableNumber, assignedServer } = req.body;

    const table = await Table.findById(req.params.id);
    if (!table) {
      return next(new HttpError("Table non trouvée.", 404));
    }

    if (tableNumber) table.tableNumber = tableNumber;
    if (assignedServer) table.assignedServer = assignedServer;

    table.activityLogs.push({
      action: "UPDATE_TABLE",
      description: `Table ${table.tableNumber} mise à jour.`,
      user: req.user.id,
    });

    const updatedTable = await table.save();
    res
      .status(200)
      .json({ message: "Table mise à jour avec succès.", table: updatedTable });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la table:", error);
    return next(new HttpError(error, 500));
  }
};

const deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return next(new HttpError("Table non trouvée.", 404));
    }

    await table.remove();
    res.status(200).json({ message: "Table supprimée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de la table:", error);
    return next(new HttpError("Erreur serveur lors de la suppression.", 500));
  }
};

module.exports = {
  addMultipleTables,
  getTbales,
  getTableById,
  updateTable,
  deleteTable,
};
