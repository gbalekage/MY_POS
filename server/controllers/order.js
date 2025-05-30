const Order = require("../models/order");
const Item = require("../models/item");
const User = require("../models/user");
const Table = require("../models/tables");
const HttpError = require("../models/error");
const {
  printInvoice,
  printCancellation,
  printReceipt,
  printSignedBill,
  printPaidSignedBill,
} = require("../services/printer");
const Cancellation = require("../models/cancellations");
const { printOrder } = require("../services/printer");
const Discount = require("../models/discount");
const Sale = require("../models/sales");
const Customer = require("../models/customer");
const SignedBill = require("../models/signedBills");
const PaidSignedBills = require("../models/paidSigendBills");

const placeOrder = async (req, res, next) => {
  try {
    const { tableId, items } = req.body;
    const userId = req.user.id;

    if (!tableId || !items || items.length === 0) {
      return next(new HttpError("Table et items requis.", 400));
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return next(new HttpError("Table introuvable.", 404));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new HttpError("Utilisateur introuvable.", 404));
    }

    const userName = user.name;

    let totalAmount = 0;
    const orderItems = [];
    const storeItemMap = {};

    for (const orderItem of items) {
      const item = await Item.findById(orderItem.itemId);
      if (!item) {
        return next(
          new HttpError(`Article introuvable : ${orderItem.itemId}`, 404)
        );
      }

      if (item.stock < orderItem.quantity) {
        return next(new HttpError(`Stock insuffisant pour ${item.name}`, 400));
      }

      // Déduire du stock
      item.stock -= orderItem.quantity;
      if (item.stock <= 0) {
        item.isActive = false;
      }

      item.activityLogs.push({
        action: "SELL_ITEM",
        performedBy: userId,
        description: `Vente de ${orderItem.quantity} unité(s).`,
      });

      await item.save();

      const itemTotal = orderItem.quantity * item.price;
      totalAmount += itemTotal;

      orderItems.push({
        item: item._id,
        quantity: orderItem.quantity,
        price: item.price,
        total: itemTotal,
        store: item.store,
      });

      // Organiser pour impression
      if (!storeItemMap[item.store]) {
        storeItemMap[item.store] = [];
      }
      storeItemMap[item.store].push({
        itemName: item.name,
        quantity: orderItem.quantity,
      });
    }

    const order = new Order({
      table: table._id,
      items: orderItems,
      totalAmount,
      attendant: userId,
    });

    await order.save();

    table.currentOrder = order._id;
    table.assignedServer = userId;
    table.status = "occupied";
    table.totalAmount = totalAmount;
    await table.save();

    await User.findByIdAndUpdate(userId, {
      $push: { assignedTables: table._id },
    });

    // Imprimer les items regroupés par store
    for (const storeId in storeItemMap) {
      try {
        await printOrder(storeItemMap[storeId], storeId, userName);
      } catch (error) {
        console.error("Erreur d'impression:", error);
      }
    }

    res.status(201).json({
      message: "Commande placée avec succès.",
      order,
    });
  } catch (error) {
    console.error("Erreur de placement de commande:", error);
    return next(new HttpError(error.message || "Erreur interne serveur.", 500));
  }
};

const addItemToOrder = async (req, res, next) => {
  try {
    const { items } = req.body;
    const tableId = req.params.tableId;
    const userId = req.user.id;

    if (!tableId || !items || items.length === 0) {
      return next(new HttpError("Table et items requis.", 400));
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return next(new HttpError("Table introuvable.", 404));
    }

    const user = await User.findById(userId);

    const username = user.name;

    const order = await Order.findById(table.currentOrder);
    if (!order) {
      return next(
        new HttpError("Aucune commande trouvée pour cette table.", 404)
      );
    }

    let totalAmount = 0;

    // Map pour regrouper les items par store
    const storeItemMap = {};

    for (const orderItem of items) {
      const item = await Item.findById(orderItem.itemId);
      if (!item) {
        return next(
          new HttpError(`Article introuvable : ${orderItem.itemId}`, 404)
        );
      }

      if (item.stock < orderItem.quantity) {
        return next(new HttpError(`Stock insuffisant pour ${item.name}`, 400));
      }

      // Déduire le stock
      item.stock -= orderItem.quantity;
      if (item.stock <= 0) {
        item.isActive = false;
      }

      item.activityLogs.push({
        action: "SELL_ITEM",
        performedBy: userId,
        description: `Vente de ${orderItem.quantity} unité(s).`,
      });

      await item.save();

      const itemTotal = orderItem.quantity * item.price;
      totalAmount += itemTotal;

      // Vérifier si l'article existe déjà dans la commande
      const existingOrderItem = order.items.find(
        (orderItem) => orderItem.item.toString() === item._id.toString()
      );

      if (existingOrderItem) {
        // Si l'article existe, on met à jour la quantité et le total
        existingOrderItem.quantity += orderItem.quantity;
        existingOrderItem.total = existingOrderItem.quantity * item.price;
      } else {
        // Si l'article n'existe pas, on l'ajoute à la commande
        const orderItemData = {
          item: item._id,
          quantity: orderItem.quantity,
          price: item.price,
          total: itemTotal,
          store: item.store,
        };

        order.items.push(orderItemData);
      }

      // Regrouper pour l'impression
      if (!storeItemMap[item.store]) {
        storeItemMap[item.store] = [];
      }
      storeItemMap[item.store].push({
        itemName: item.name,
        quantity: orderItem.quantity,
      });
    }

    // Mettre à jour le total de la commande
    order.totalAmount += totalAmount;
    await order.save();

    table.totalAmount += totalAmount;
    await table.save();

    // Imprimer pour chaque store
    for (const storeId in storeItemMap) {
      try {
        await printOrder(storeItemMap[storeId], storeId, username);
      } catch (error) {
        console.error("Erreur d'impression:", error);
      }
    }

    res.status(200).json({
      message: "Article(s) ajouté(s) à la commande avec succès.",
      order,
    });
  } catch (error) {
    console.error("Erreur d'ajout d'article à la commande:", error);
    return next(new HttpError(error.message || "Erreur interne serveur.", 500));
  }
};

const printFacture = async (req, res, next) => {
  try {
    const { tableId } = req.params;
    const userId = req.user.id;

    if (!tableId) {
      return next(new HttpError("ID de la table requis.", 400));
    }

    const table = await Table.findById(tableId).populate("currentOrder");
    if (!table || !table.currentOrder) {
      return next(
        new HttpError("Aucune commande trouvée pour cette table.", 404)
      );
    }

    const order = table.currentOrder;
    const user = await User.findById(userId);

    if (!user) {
      return next(new HttpError("Utilisateur non trouvé.", 404));
    }

    const invoice = {
      invoiceNumber: `FAC-${order._id.toString().slice(-6).toUpperCase()}`,
      date: new Date().toLocaleString("fr-FR"),
      serverName: user.name,
      items: [],
      totalAmount: order.totalAmount,
    };

    // Charger les noms des articles
    for (const orderItem of order.items) {
      invoice.items.push({
        itemName: (await Item.findById(orderItem.item)).name,
        quantity: orderItem.quantity,
        unitPrice: orderItem.price,
      });
    }

    await printInvoice(invoice);

    res.status(200).json({
      message: "Facture imprimée avec succès.",
    });
  } catch (error) {
    console.error("Erreur d'impression de la facture:", error);
    return next(new HttpError(error.message || "Erreur interne serveur.", 500));
  }
};

const cancelItemsFromOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemsToCancel } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId).populate("attendant", "table");
    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée." });
    }

    const tableId = order.table._id;
    const table = await Table.findById(tableId);

    const attendant = order.attendant?.name;

    const updatedItems = [];
    const cancellationsToSave = [];
    const storeItemMap = {}; // <- pour organiser par store pour impression

    for (const item of order.items) {
      const toCancel = itemsToCancel.find(
        (i) => i.itemId.toString() === item.item.toString()
      );

      if (toCancel) {
        const itemDetails = await Item.findById(item.item);
        if (!itemDetails) {
          throw new Error(`Article non trouvé: ${item.item}`);
        }

        if (item.quantity > toCancel.quantity) {
          updatedItems.push({
            ...item.toObject(),
            quantity: item.quantity - toCancel.quantity,
            total: (item.quantity - toCancel.quantity) * item.price,
          });

          cancellationsToSave.push({
            name: itemDetails.name,
            quantity: toCancel.quantity,
            unitPrice: item.price,
            totalPrice: toCancel.quantity * item.price,
            cancelledBy: userId,
          });

          await Item.findByIdAndUpdate(item.item, {
            $inc: { stock: toCancel.quantity },
          });
        } else if (item.quantity === toCancel.quantity) {
          updatedItems.push({
            ...item.toObject(),
            quantity: 0,
            total: 0,
          });

          cancellationsToSave.push({
            name: itemDetails.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.quantity * item.price,
            cancelledBy: userId,
          });

          await Item.findByIdAndUpdate(item.item, {
            $inc: { stock: item.quantity },
          });
        } else {
          throw new Error(
            `Quantité à annuler trop grande pour l'article avec ID ${item.item}`
          );
        }

        // Organiser pour impression par store
        if (!storeItemMap[itemDetails.store]) {
          storeItemMap[itemDetails.store] = [];
        }
        storeItemMap[itemDetails.store].push({
          itemName: itemDetails.name,
          quantity: toCancel.quantity,
        });
      } else {
        updatedItems.push({
          ...item.toObject(),
          total: item.quantity * item.price,
        });
      }
    }

    // Vérifier si tous les items sont annulés
    const remainingItems = updatedItems.filter((item) => item.quantity > 0);

    if (remainingItems.length === 0) {
      // Tous les articles sont annulés => Supprimer la commande
      await Order.findByIdAndDelete(orderId);

      const table = await Table.findOne({ currentOrder: orderId });
      if (table) {
        const assignedServerId = table.assignedServer;

        table.status = "available";
        table.assignedServer = null;
        table.currentOrder = null;
        table.totalAmount = 0;
        await table.save();

        if (assignedServerId) {
          await User.findByIdAndUpdate(assignedServerId, {
            $pull: { assignedTables: table._id },
          });
        }
      }
    } else {
      // Il reste des articles => Mise à jour normale
      order.items = remainingItems;
      order.totalAmount = order.items.reduce(
        (sum, item) => sum + (item.total || 0),
        0
      );
      await order.save();
      table.totalAmount = order.items.reduce(
        (sum, item) => sum + (item.total || 0),
        0
      );
      await table.save();
    }

    // Enregistrer les annulations
    if (cancellationsToSave.length > 0) {
      await Cancellation.insertMany(cancellationsToSave);
    }

    // Imprimer par store
    for (const storeId in storeItemMap) {
      try {
        await printCancellation(storeItemMap[storeId], storeId, attendant);
      } catch (error) {
        console.error("Erreur d'impression des annulations:", error);
      }
    }

    return res.status(200).json({
      message:
        remainingItems.length === 0
          ? "Tous les articles annulés, commande supprimée, table libérée."
          : "Articles annulés, commande mise à jour, stock mis à jour, annulations enregistrées.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de l'annulation des articles.",
      error: error.message,
    });
  }
};

const discountOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { discountPercentage } = req.body;

    console.log("Discount Pourcentage depuis API ", discountPercentage);

    const userId = req.user._id;

    const validDiscounts = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    if (!validDiscounts.includes(discountPercentage)) {
      return res
        .status(400)
        .json({ message: "Pourcentage de réduction invalide." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée." });
    }

    const table = await Table.findOne({ currentOrder: orderId });

    const discountAmount = (order.totalAmount * discountPercentage) / 100;
    const discountedTotal = order.totalAmount - discountAmount;

    const discount = new Discount({
      discountedBy: userId,
      order: orderId,
      discountPercentage,
      discountAmount,
      newTotalAmount: discountedTotal,
    });

    await discount.save();
    order.totalAmount = discountedTotal;
    order.status = "pending";

    await order.save();

    table.totalAmount = discountedTotal;
    await table.save();

    return res.status(200).json({
      message: `Réduction de ${discountPercentage}% appliquée avec succès.`,
      order,
      discount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de l'application de la réduction.",
      error: error.message,
    });
  }
};

const splitBill = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemsToSplit, newTableId } = req.body;

    if (
      !orderId ||
      !Array.isArray(itemsToSplit) ||
      itemsToSplit.length === 0 ||
      !newTableId
    ) {
      return res
        .status(400)
        .json({ message: "la commande, les items, et la table sont requis." });
    }

    const originalOrder = await Order.findById(orderId);
    if (!originalOrder) {
      return res
        .status(404)
        .json({ message: "Commande originale introuvable." });
    }

    let newItems = [];
    let updatedOriginalItems = [];
    let newTotalAmount = 0;
    let updatedTotalAmount = 0;

    // Map pour vérifier rapidement ce qu'on doit splitter
    const splitMap = {};
    for (const item of itemsToSplit) {
      splitMap[item.itemId] = item.quantity;
    }

    for (const originalItem of originalOrder.items) {
      const itemIdStr = originalItem.item.toString();
      if (splitMap[itemIdStr]) {
        const splitQuantity = splitMap[itemIdStr];

        if (splitQuantity > originalItem.quantity) {
          return res.status(400).json({
            message: `Quantité à diviser supérieure à celle existante pour l'article ${itemIdStr}.`,
          });
        }

        // Créer l'item pour la nouvelle facture
        newItems.push({
          item: originalItem.item,
          quantity: splitQuantity,
          price: originalItem.price,
          total: originalItem.price * splitQuantity,
        });

        newTotalAmount += originalItem.price * splitQuantity;

        const remainingQuantity = originalItem.quantity - splitQuantity;
        if (remainingQuantity > 0) {
          // Garder l'item mis à jour dans la commande originale
          updatedOriginalItems.push({
            item: originalItem.item,
            quantity: remainingQuantity,
            price: originalItem.price,
            total: originalItem.price * remainingQuantity,
          });
          updatedTotalAmount += originalItem.price * remainingQuantity;
        }
      } else {
        // Item non concerné par le split => garder dans original
        updatedOriginalItems.push(originalItem);
        updatedTotalAmount += originalItem.total;
      }
    }

    // Mettre à jour la commande originale
    originalOrder.items = updatedOriginalItems;
    originalOrder.totalAmount = updatedTotalAmount;
    await originalOrder.save();

    const newOrder = new Order({
      table: newTableId,
      items: newItems,
      totalAmount: newTotalAmount,
      status: originalOrder.status,
      attendant: originalOrder.attendant,
    });
    await newOrder.save();

    await Table.findByIdAndUpdate(newTableId, {
      currentOrder: newOrder._id,
      status: "occupied",
      assignedServer: newOrder.attendant,
    });

    return res.status(201).json({
      message: "Facture divisée avec succès.",
      originalOrder,
      newOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de la division de la facture.",
      error: error.message,
    });
  }
};

const breakItemInOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemId, quantityToBreak } = req.body;

    if (!orderId || !itemId || !quantityToBreak || quantityToBreak <= 0) {
      return res.status(400).json({
        message:
          "Order ID, item ID, and quantity to break are required and must be valid.",
      });
    }

    const order = await Order.findById(orderId).populate("items.item");
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Comparaison corrigée : item.item est un objet après le populate
    const originalItemIndex = order.items.findIndex(
      (item) =>
        item.item && item.item._id && item.item._id.toString() === itemId
    );

    if (originalItemIndex === -1) {
      return res.status(404).json({ message: "Item not found in the order." });
    }

    const originalItem = order.items[originalItemIndex];

    if (quantityToBreak >= originalItem.quantity) {
      return res.status(400).json({
        message:
          "The quantity to break must be less than the existing item quantity.",
      });
    }

    const remainingQuantity = originalItem.quantity - quantityToBreak;
    order.items[originalItemIndex].quantity = remainingQuantity;
    order.items[originalItemIndex].total =
      remainingQuantity * originalItem.price;

    const newSplitItem = {
      item: originalItem.item._id, // On utilise l'ObjectId ici pour rester cohérent
      quantity: quantityToBreak,
      price: originalItem.price,
      total: quantityToBreak * originalItem.price,
    };

    order.items.push(newSplitItem);

    // Recalcul du total général
    order.totalAmount = order.items.reduce((sum, item) => sum + item.total, 0);

    // Journalisation de l'action
    order.activityLogs.push({
      action: "break_item",
      description: `Item ${itemId} split: ${quantityToBreak} separated.`,
      user: req.user ? req.user._id : null,
    });

    await order.save();

    return res.status(200).json({
      message: "Item successfully split in the order.",
      order,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error while splitting item in the order.",
      error: error.message,
    });
  }
};

const payOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, receivedAmount } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json({ message: "Sélectionner une commande est requis." });
    }

    if (receivedAmount === undefined || receivedAmount === null) {
      return res.status(400).json({ message: "Le montant reçu est requis." });
    }

    const order = await Order.findById(orderId).populate("table");
    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée." });
    }

    if (order.status === "paid") {
      return res
        .status(400)
        .json({ message: "Cette commande est déjà payée." });
    }

    const totalAmount = order.totalAmount;

    if (receivedAmount < totalAmount) {
      const remainingAmount = totalAmount - receivedAmount;
      return res.status(400).json({
        message: "Montant insuffisant.",
        remainingAmount,
      });
    }

    const change = receivedAmount - totalAmount;

    // Préparer correctement les items pour la vente
    const saleItems = order.items.map((item) => ({
      item: item.item || item._id,
      quantity: item.quantity || 1,
      itemName: item.itemName || "Article",
      price: item.unitPrice || item.price || 0,
      total: (item.unitPrice || item.price || 0) * (item.quantity || 1),
    }));

    // Ajouter une vente
    const sale = new Sale({
      table: order.table._id,
      items: saleItems,
      totalAmount: order.totalAmount,
      paymentMethod: paymentMethod,
      attendant: order.attendant,
      receivedAmount: receivedAmount,
      change: change,
      status: "paid",
    });
    await sale.save();

    // Libérer la table
    await Table.findByIdAndUpdate(order.table._id, {
      status: "available",
      currentOrder: null,
      assignedServer: null,
      totalAmount: 0,
      $push: {
        activityLogs: {
          action: "table_freed",
          description: "Table libérée après paiement.",
          user: req.user._id,
        },
      },
    });

    // Retirer la table de l'utilisateur
    await User.findByIdAndUpdate(order.attendant, {
      $pull: { assignedTables: order.table._id },
    });

    // 🖨️ Imprimer le reçu
    await printReceipt(sale._id, order);

    await Order.findByIdAndDelete(orderId);

    return res.status(200).json({
      message: "Commande payée et enregistrée dans les ventes.",
      sale,
      change: change,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors du paiement de la commande.",
      error: error.message,
    });
  }
};

const signBill = async (req, res) => {
  try {
    const { orderId, clientId } = req.params;
    if (!orderId) {
      return res
        .status(400)
        .json({ message: "Sélectionner une commande est requis." });
    }

    if (!clientId) {
      return res
        .status(400)
        .json({ message: "Sélectionner un client est requis." });
    }

    const order = await Order.findById(orderId).populate("table");
    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée." });
    }

    const client = await Customer.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé." });
    }

    if (order.status === "paid") {
      return res
        .status(400)
        .json({ message: "Cette commande est déjà payée." });
    }

    const saleItems = order.items.map((item) => ({
      item: item.item || item._id,
      quantity: item.quantity || 1,
      itemName: item.itemName || "Article",
      price: item.unitPrice || item.price || 0,
      total: (item.unitPrice || item.price || 0) * (item.quantity || 1),
    }));

    const sale = new SignedBill({
      items: saleItems,
      totalAmount: order.totalAmount,
      attendant: order.attendant,
      customer: client._id,
    });
    await sale.save();

    client.bills.push(sale._id);
    client.activityLogs.push({
      action: "sign_bill",
      description: `Commande ${sale._id} signée pour le client.`,
      user: req.user._id,
    });
    await client.save();

    await printSignedBill(sale._id, order);

    const table = await Table.findById(order.table._id);
    if (table) {
      table.status = "available";
      table.assignedServer = null;
      table.currentOrder = null;
      table.totalAmount = 0;
      table.activityLogs.push({
        action: "free_table",
        description: "Table libérée après signature de la commande.",
        user: req.user._id,
      });
      await table.save();
    }

    if (order.attendant) {
      const attendant = await User.findById(order.attendant);
      if (attendant) {
        attendant.assignedTables = attendant.assignedTables.filter(
          (tableId) => tableId.toString() !== table._id.toString()
        );

        attendant.activityLogs.push({
          action: "unassign_table",
          description: `Table ${table.tableNumber} retirée des tables assignées.`,
          user: req.user._id,
        });
        await attendant.save();
      }
    }

    await Order.findByIdAndDelete(orderId);

    return res.status(200).json({
      message:
        "Commande signée, enregistrée dans les ventes, table libérée, serveur mis à jour, commande supprimée.",
      sale,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de la signature de la commande.",
      error: error.message,
    });
  }
};

const receivePayment = async (req, res) => {
  try {
    const { signedBillId } = req.params;
    const { paymentMethod, receivedAmount } = req.body;

    if (!signedBillId || !paymentMethod || receivedAmount == null) {
      return res.status(400).json({ message: "Données incomplètes." });
    }

    const signedBill = await SignedBill.findById(signedBillId);
    if (!signedBill) {
      return res.status(404).json({ message: "Facture signée non trouvée." });
    }

    const customer = await Customer.findById(signedBill.customer);
    if (!customer) {
      return res.status(404).json({ message: "Client non trouvé." });
    }

    if (receivedAmount < signedBill.totalAmount) {
      return res.status(400).json({
        message: `Le montant reçu (${receivedAmount}) est insuffisant. Le montant total dû est ${signedBill.totalAmount}.`,
      });
    }

    const change = receivedAmount - signedBill.totalAmount;

    const signedBillPaid = new PaidSignedBills({
      items: signedBill.items,
      totalAmount: signedBill.totalAmount,
      customer: signedBill.customer,
      attendant: signedBill.attendant,
      paymentMethod,
      receivedAmount,
      change: change > 0 ? change : 0,
    });

    await signedBillPaid.save();

    customer.bills = customer.bills.filter(
      (billId) => billId.toString() !== signedBillId
    );

    customer.activityLogs.push({
      action: "bill_paid",
      description: `Facture signée payée avec ${paymentMethod}, change: ${change > 0 ? change : 0
        }.`,
      user: req.user.id,
    });

    await customer.save();

    await printPaidSignedBill(signedBillPaid._id, signedBill);

    // Supprimer la facture signée
    await SignedBill.findByIdAndDelete(signedBillId);

    return res.status(200).json({
      message: "Facture signée payée avec succès, client libéré.",
      signedBillPaid,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors du paiement de la facture.",
      error: error.message,
    });
  }
};

const getOrderByTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const order = await Order.findOne({ table: tableId }).populate({
      path: "items.item",
      select: "name price",
    });

    if (!order) {
      return res.status(404).json({ message: "Commande non trouve" });
    }

    const items = order.items.map((item) => ({
      _id: item.item._id,
      name: item.item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    res.status(200).json({ items });
  } catch (error) {
    console.log(error);
  }
};

const todayOrderCount = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await Order.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
    res.status(200).json({ orders: count });
  } catch (error) {
    console.error("Error fetching paid sales count:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des commandes." });
  }
};

const getTodayOrders = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate("items.item") // Populate item details
      .populate("attendant") // Populate attendant details
      .populate("table"); // Populate table details

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching today's orders:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des commandes." });
  }
};

const getTotalOrdersSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sales = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const totalAmount = sales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0
    );
    const numberOfSales = sales.length;

    res.status(200).json({ totalAmount, numberOfSales });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ message: "ID de la commande requis." });
    }
    const order = await Order.findById(orderId)
      .populate("items.item")
      .populate("attendant")
      .populate("table");

    if (!order) {
      return res.status(400).json({ message: "Commande non trouvé." });
    }

    res.status(200).json({ order })
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
}

module.exports = {
  placeOrder,
  addItemToOrder,
  printFacture,
  getOrderByTable,
  getOrderById,
  cancelItemsFromOrder,
  discountOrder,
  splitBill,
  breakItemInOrder,
  payOrder,
  signBill,
  receivePayment,
  todayOrderCount,
  getTodayOrders,
  getTotalOrdersSummary,
};
